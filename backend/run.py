import os
from app import create_app, db
from app.models import Course, Module, Lab, Resource, Quiz, Project, User, Progress
import json
import sys
from pathlib import Path
import re
from datetime import datetime, timedelta

# Default to development for container safety; override via FLASK_ENV env var
flask_env = os.environ.get('FLASK_ENV', 'development').strip()
app = create_app(flask_env)

@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'Course': Course, 'Module': Module, 'Lab': Lab, 'Resource': Resource, 'Quiz': Quiz, 'Project': Project, 'User': User, 'Progress': Progress}

def parse_markdown_and_seed(md_text):
    """Robust parser to extract Parts -> Modules -> Labs/Quizzes/Projects from markdown.
    Extracts: PART (Course), MODULE (Module), THEORY, LABS, QUIZZES, PROJECTS.
    """
    lines = md_text.split('\n')
    courses = []
    current_course = None
    current_module = None
    i = 0
    
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # === PART === (Course)
        if line.startswith('## PART'):
            if current_course and current_module:
                current_course['modules'].append(current_module)
                current_module = None
            if current_course:
                courses.append(current_course)
            
            # Extract part title and description
            title_match = re.match(r'^## PART\s+(\d+):\s*(.+)$', line)
            if title_match:
                title = title_match.group(2).strip()
            else:
                title = line.replace('## PART', '').strip()
            
            description = ''
            # Try to extract description from next line
            j = i + 1
            while j < len(lines) and lines[j].startswith('**'):
                description = lines[j].strip()
                break
            
            current_course = {
                'title': title,
                'description': description,
                'modules': []
            }
            current_module = None
        
        # === MODULE ===
        elif line.startswith('### MODULE') and current_course:
            if current_module:
                current_course['modules'].append(current_module)
            
            # Extract module title
            title_match = re.match(r'^### MODULE\s+([\d\.]+):\s*(.+)$', line)
            if title_match:
                title = title_match.group(2).strip()
            else:
                title = line.replace('### MODULE', '').strip()
            
            current_module = {
                'title': title,
                'description': '',
                'content': '',
                'labs': [],
                'quizzes': [],
                'projects': []
            }
        
        # === THEORY ===
        elif stripped.startswith('#### THEORY:') and current_module:
            i += 1
            theory_lines = []
            while i < len(lines):
                nxt = lines[i]
                if nxt.startswith('####') or nxt.startswith('###') or nxt.startswith('## PART'):
                    break
                theory_lines.append(nxt)
                i += 1
            current_module['content'] = '\n'.join(theory_lines).strip()
            i -= 1  # Backtrack since loop will increment
        
        # === LABS ===
        elif stripped.startswith('#### LABS:') and current_module:
            i += 1
            while i < len(lines):
                nxt = lines[i]
                if nxt.startswith('####') or nxt.startswith('###') or nxt.startswith('## PART'):
                    break
                lab_line = nxt.strip()
                # Match "Lab X.Y.Z: Title"
                lab_match = re.match(r'^Lab\s+([\d\.]+):\s*(.+)$', lab_line)
                if lab_match:
                    lab_title = f"Lab {lab_match.group(1)}: {lab_match.group(2)}"
                    i += 1
                    desc_lines = []
                    while i < len(lines):
                        nxt2 = lines[i]
                        if nxt2.startswith('####') or nxt2.startswith('###') or nxt2.startswith('## PART'):
                            break
                        if nxt2.startswith('- ') or nxt2.startswith('  '):
                            desc_lines.append(nxt2.strip())
                            i += 1
                        else:
                            break
                    current_module['labs'].append({
                        'title': lab_title,
                        'description': '\n'.join(desc_lines),
                        'objective': '',
                        'steps': json.dumps(desc_lines),
                        'expected_outcome': '',
                        'difficulty': 'Intermediate'
                    })
                    i -= 1  # Backtrack since outer while will increment
                i += 1
            i -= 1  # Backtrack since outer loop will increment
        
        # === QUIZZES ===
        elif stripped.startswith('#### QUIZZES:') and current_module:
            i += 1
            while i < len(lines):
                nxt = lines[i]
                if nxt.startswith('####') or nxt.startswith('###') or nxt.startswith('## PART'):
                    break
                quiz_line = nxt.strip()
                quiz_match = re.match(r'^Quiz\s+([\d\.]+):\s*(.+)$', quiz_line)
                if quiz_match:
                    quiz_title = f"Quiz {quiz_match.group(1)}: {quiz_match.group(2)}"
                    i += 1
                    questions = []
                    while i < len(lines):
                        nxt2 = lines[i]
                        if nxt2.startswith('####') or nxt2.startswith('###') or nxt2.startswith('## PART'):
                            break
                        q = nxt2.strip('- ').strip()
                        if q and not q.startswith('```') and not q.startswith('---'):
                            questions.append(q)
                        i += 1
                    current_module['quizzes'].append({
                        'title': quiz_title,
                        'questions': json.dumps(questions)
                    })
                    i -= 1
                i += 1
            i -= 1
        
        i += 1
    
    # Append final module and course
    if current_course and current_module:
        current_course['modules'].append(current_module)
    if current_course:
        courses.append(current_course)
    
    # === SEED INTO DATABASE ===
    for course_data in courses:
        course = Course(
            title=course_data['title'],
            description=course_data['description'],
            order=len(courses)
        )
        db.session.add(course)
        db.session.flush()
        
        for mod_idx, mod_data in enumerate(course_data.get('modules', [])):
            module = Module(
                course_id=course.id,
                title=mod_data['title'],
                description=mod_data.get('description', ''),
                content=mod_data.get('content', ''),
                order=mod_idx
            )
            db.session.add(module)
            db.session.flush()
            
            # Add labs
            for lab_idx, lab_data in enumerate(mod_data.get('labs', [])):
                lab = Lab(
                    module_id=module.id,
                    title=lab_data.get('title', 'Lab'),
                    description=lab_data.get('description', ''),
                    objective=lab_data.get('objective', ''),
                    steps=lab_data.get('steps', json.dumps([])),
                    expected_outcome=lab_data.get('expected_outcome', ''),
                    difficulty=lab_data.get('difficulty', 'Intermediate'),
                    order=lab_idx
                )
                db.session.add(lab)
            
            # Add quizzes
            for quiz_idx, quiz_data in enumerate(mod_data.get('quizzes', [])):
                quiz = Quiz(
                    module_id=module.id,
                    title=quiz_data.get('title', 'Quiz'),
                    questions=quiz_data.get('questions', json.dumps([])),
                    order=quiz_idx
                )
                db.session.add(quiz)
            
            # Add projects
            for proj_idx, proj_data in enumerate(mod_data.get('projects', [])):
                proj = Project(
                    module_id=module.id,
                    course_id=course.id,
                    title=proj_data.get('title', 'Project'),
                    description=proj_data.get('description', ''),
                    deliverables=proj_data.get('deliverables', ''),
                    order=proj_idx
                )
                db.session.add(proj)
        
        db.session.flush()
    
    db.session.commit()
    print(f"Seeded {len(courses)} courses with modules, labs, quizzes, and projects.")


def seed_sample_progress():
    """Create sample progress entries for the 'local' user to show non-zero progress on dashboard."""
    # Ensure local user exists
    local_user = User.query.filter_by(username='local').first()
    if not local_user:
        local_user = User(username='local', email='local@devops-platform.local')
        db.session.add(local_user)
        db.session.flush()
        db.session.commit()
    print(f"Default user '{local_user.username}' created. No sample progress seeded.")


def init_db():
    """Initialize database using the comprehensive progress tracker content when empty."""
    with app.app_context():
        db.create_all()

        if Course.query.count() > 0:
            print("Database already initialized — preserving existing data.")
            return

        # Prefer the local file in repository if present
        repo_md = Path(app.root_path).parent / 'data' / 'PROGRESS_TRACKER_COMPLETE_CONTENT.md'
        downloads_md = Path(os.path.expanduser('~')) / 'Downloads' / 'PROGRESS_TRACKER_COMPLETE_CONTENT.md'

        md_text = None
        if repo_md.exists():
            content = repo_md.read_text(encoding='utf-8')
            # If the repo file looks like the full tracker (contains PART headings), use it.
            if '## PART' in content:
                md_text = content
                print(f'Seeding database from {repo_md}')
            else:
                # Fallback to Downloads if the repo copy is a placeholder or incomplete
                if downloads_md.exists():
                    md_text = downloads_md.read_text(encoding='utf-8')
                    print(f'Seeding database from {downloads_md}')
        elif downloads_md.exists():
            md_text = downloads_md.read_text(encoding='utf-8')
            print(f'Seeding database from {downloads_md}')
        else:
            # fallback: try to load data file shipped with the backend
            try:
                pkg_file = Path(__file__).parent / 'data' / 'PROGRESS_TRACKER_COMPLETE_CONTENT.md'
                if pkg_file.exists():
                    md_text = pkg_file.read_text(encoding='utf-8')
            except Exception:
                md_text = None

        if md_text:
            parse_markdown_and_seed(md_text)
            seed_sample_progress()
            print("Database initialized from progress tracker content with sample progress.")
        else:
            print('No progress tracker markdown found to seed. No data seeded.')


if __name__ == '__main__':
    # Optionally delete existing database for fresh reseed (comment out to preserve)
    db_path = Path(app.root_path).parent / 'devops_platform.db'
    if db_path.exists():
        db_path.unlink()
        print(f"Deleted existing database: {db_path}")
    
    init_db()
    
    # Warn if SECRET_KEY not set in production
    if flask_env == 'production' and not os.environ.get('SECRET_KEY'):
        print("ERROR: SECRET_KEY environment variable must be set in production!")
        sys.exit(1)
    
    # Run with debug based on config
    debug = flask_env == 'development'
    app.run(debug=debug, host='0.0.0.0', port=5000)

