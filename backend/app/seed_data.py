import json
import re
import os
import logging

logger = logging.getLogger(__name__)

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'PROGRESS_TRACKER_COMPLETE_CONTENT.md')


def seed_from_md(app):
    """Parse PROGRESS_TRACKER_COMPLETE_CONTENT.md and seed the database."""
    from app import db
    from app.models import Course, Module, Lab, Quiz

    if not os.path.exists(DATA_FILE):
        logger.warning(f"Seed data file not found: {DATA_FILE}")
        return

    # Only seed if DB is empty
    if Course.query.first() is not None:
        logger.info("Database already seeded, skipping.")
        return

    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    current_course = None
    current_module = None
    parsing_section = None
    in_code_block = False
    code_lines = []

    course_pattern = re.compile(r'^## PART (\d+): (.+)$')
    module_pattern = re.compile(r'^### MODULE (\d+\.\d+): (.+)$')
    section_pattern = re.compile(r'^#### (THEORY|LABS|QUIZZES):$')

    labs_content = []
    quizzes_content = []
    theory_content = None

    for line in lines:
        stripped = line.rstrip('\n')

        # Check for course header
        cm = course_pattern.match(stripped)
        if cm:
            _save_module_data(db, current_module, current_course, theory_content, labs_content, quizzes_content)
            _save_course_data(db, current_course)

            current_course = {
                'title': cm.group(2).strip(),
                'description': '',
                'order': int(cm.group(1)),
            }
            current_module = None
            theory_content = None
            labs_content = []
            quizzes_content = []
            parsing_section = None
            in_code_block = False
            code_lines = []
            continue

        # Check for module header
        mm = module_pattern.match(stripped)
        if mm:
            _save_module_data(db, current_module, current_course, theory_content, labs_content, quizzes_content)

            # Ensure course is saved to DB before saving modules under it
            if current_course and '_id' not in current_course:
                _save_course_data(db, current_course)

            current_module = {
                'title': mm.group(2).strip(),
                'description': '',
                'order': float(mm.group(1)),
            }
            theory_content = None
            labs_content = []
            quizzes_content = []
            parsing_section = None
            in_code_block = False
            code_lines = []
            continue

        # Parse course description (line after PART heading with **Duration:**)
        if current_course and current_course['description'] == '' and '**Duration:**' in stripped:
            current_course['description'] = stripped.strip()

        # Parse module description
        if current_module and current_module['description'] == '' and '**Duration:**' in stripped:
            current_module['description'] = stripped.strip()

        # Check for section headers (THEORY, LABS, QUIZZES)
        sm = section_pattern.match(stripped)
        if sm:
            parsing_section = sm.group(1)
            in_code_block = False
            code_lines = []
            continue

        # Handle code blocks (```)
        if parsing_section and stripped.strip().startswith('```'):
            if in_code_block:
                # Closing code block - save content
                if parsing_section == 'THEORY':
                    theory_content = '\n'.join(code_lines)
                elif parsing_section == 'LABS':
                    labs_content = code_lines[:]
                elif parsing_section == 'QUIZZES':
                    quizzes_content = code_lines[:]
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
            continue

        if in_code_block:
            code_lines.append(stripped)

    # Save last module and course
    _save_module_data(db, current_module, current_course, theory_content, labs_content, quizzes_content)
    _save_course_data(db, current_course)

    db.session.commit()
    logger.info("Database seeded successfully from PROGRESS_TRACKER_COMPLETE_CONTENT.md")


def _save_course_data(db, course_data):
    if course_data is None:
        return
    from app.models import Course
    existing = Course.query.filter_by(order=course_data['order']).first()
    if not existing:
        course = Course(
            title=course_data['title'],
            description=course_data.get('description', ''),
            order=course_data['order'],
        )
        db.session.add(course)
        db.session.flush()
        course_data['_id'] = course.id
    else:
        course_data['_id'] = existing.id


def _save_module_data(db, module_data, course_data, theory, labs_raw, quizzes_raw):
    if module_data is None or course_data is None or '_id' not in course_data:
        return
    from app.models import Module, Lab, Quiz

    existing = Module.query.filter_by(course_id=course_data['_id'], order=module_data['order']).first()
    if existing:
        return

    content = f"```\n{theory}\n```" if theory else ''

    module = Module(
        course_id=course_data['_id'],
        title=module_data['title'],
        description=module_data.get('description', ''),
        content=content,
        order=module_data['order'],
    )
    db.session.add(module)
    db.session.flush()

    if labs_raw:
        _parse_labs(db, module.id, labs_raw)

    if quizzes_raw:
        _parse_quizzes(db, module.id, quizzes_raw)


def _parse_labs(db, module_id, lab_lines):
    from app.models import Lab
    import json

    current_lab = None
    lab_title_pattern = re.compile(r'^Lab\s+[\d.]+:\s+(.+)$')
    step_items = []

    for line in lab_lines:
        stripped = line.strip()
        if not stripped:
            continue

        ltm = lab_title_pattern.match(stripped)
        if ltm:
            if current_lab:
                _save_lab(db, module_id, current_lab, step_items)

            current_lab = ltm.group(1).strip()
            step_items = []
        elif stripped.startswith('- ') and current_lab:
            step_items.append(stripped)
        elif current_lab:
            step_items.append(stripped)

    if current_lab:
        _save_lab(db, module_id, current_lab, step_items)


def _save_lab(db, module_id, title, step_items):
    from app.models import Lab
    lab = Lab(
        module_id=module_id,
        title=title,
        description='\n'.join(step_items) if step_items else '',
        steps=json.dumps(step_items) if step_items else '[]',
        order=Lab.query.filter_by(module_id=module_id).count(),
    )
    db.session.add(lab)


def _parse_quizzes(db, module_id, quiz_lines):
    from app.models import Quiz
    import json

    current_quiz = None
    quiz_title_pattern = re.compile(r'^Quiz\s+[\d.]+:\s+(.+)$')
    questions = []

    for line in quiz_lines:
        stripped = line.strip()
        if not stripped:
            continue

        qtm = quiz_title_pattern.match(stripped)
        if qtm:
            if current_quiz:
                _save_quiz(db, module_id, current_quiz, questions)

            current_quiz = qtm.group(1).strip()
            questions = []
        elif stripped.startswith('- ') and current_quiz:
            questions.append(stripped[2:].strip())
        elif current_quiz:
            questions.append(stripped)

    if current_quiz:
        _save_quiz(db, module_id, current_quiz, questions)


def _save_quiz(db, module_id, title, questions):
    from app.models import Quiz
    quiz = Quiz(
        module_id=module_id,
        title=title,
        questions=json.dumps(questions) if questions else '[]',
        order=Quiz.query.filter_by(module_id=module_id).count(),
    )
    db.session.add(quiz)
