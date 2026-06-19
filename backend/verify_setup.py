#!/usr/bin/env python3
"""
Verification script to check if the DevOps Platform is properly set up.
Run this after initial setup to verify database seeding and functionality.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app import create_app, db
from app.models import Course, Module, Lab, Quiz, Project, User, Progress

def print_header(text):
    """Print formatted header"""
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")

def print_success(text):
    """Print success message"""
    print(f"✅ {text}")

def print_error(text):
    """Print error message"""
    print(f"❌ {text}")

def print_info(text):
    """Print info message"""
    print(f"ℹ️  {text}")

def verify_database():
    """Verify database exists and has content"""
    print_header("Database Verification")
    
    app = create_app('development')
    with app.app_context():
        # Check if database file exists
        db_path = Path(app.root_path).parent / 'instance' / 'devops_platform.db'
        if not db_path.exists():
            print_error(f"Database file not found: {db_path}")
            print_info("Run 'python run.py' to create and seed the database")
            return False
        
        print_success(f"Database file exists: {db_path}")
        
        # Check courses
        course_count = Course.query.count()
        if course_count == 0:
            print_error("No courses found in database")
            print_info("Run 'python run.py' to seed the database")
            return False
        
        print_success(f"Found {course_count} courses")
        
        # Check modules
        module_count = Module.query.count()
        print_success(f"Found {module_count} modules")
        
        # Check labs
        lab_count = Lab.query.count()
        print_success(f"Found {lab_count} labs")
        
        # Check quizzes
        quiz_count = Quiz.query.count()
        print_success(f"Found {quiz_count} quizzes")
        
        # Check projects
        project_count = Project.query.count()
        print_success(f"Found {project_count} projects")
        
        # Check users
        user_count = User.query.count()
        if user_count == 0:
            print_error("No users found")
            return False
        print_success(f"Found {user_count} user(s)")
        
        # Check progress
        progress_count = Progress.query.count()
        print_success(f"Found {progress_count} progress entries")
        
        return True

def verify_content_structure():
    """Verify content structure and relationships"""
    print_header("Content Structure Verification")
    
    app = create_app('development')
    with app.app_context():
        courses = Course.query.order_by(Course.order).all()
        
        for course in courses:
            print(f"\n📚 Course: {course.title}")
            modules = Module.query.filter_by(course_id=course.id).order_by(Module.order).all()
            print(f"   └─ {len(modules)} modules")
            
            total_labs = 0
            total_quizzes = 0
            
            for module in modules:
                labs = Lab.query.filter_by(module_id=module.id).all()
                quizzes = Quiz.query.filter_by(module_id=module.id).all()
                total_labs += len(labs)
                total_quizzes += len(quizzes)
            
            print(f"   └─ {total_labs} labs total")
            print(f"   └─ {total_quizzes} quizzes total")
        
        print_success("\nContent structure verified")
        return True

def verify_progress_tracking():
    """Verify progress tracking functionality"""
    print_header("Progress Tracking Verification")
    
    app = create_app('development')
    with app.app_context():
        # Check for local user
        local_user = User.query.filter_by(username='local').first()
        if not local_user:
            print_error("Default 'local' user not found")
            return False
        
        print_success(f"Default user found: {local_user.username}")
        
        # Check progress entries
        completed_labs = Progress.query.filter_by(
            user_id=local_user.id,
            completed=True
        ).filter(Progress.lab_id.isnot(None)).count()
        
        total_labs = Lab.query.count()
        
        if completed_labs > 0:
            print_success(f"Sample progress created: {completed_labs}/{total_labs} labs completed")
            completion_percent = round((completed_labs / total_labs * 100), 1) if total_labs > 0 else 0
            print_info(f"Overall completion: {completion_percent}%")
        else:
            print_info("No labs marked complete yet (this is normal for fresh install)")
        
        return True

def verify_analytics_data():
    """Verify analytics endpoint data"""
    print_header("Analytics Data Verification")
    
    app = create_app('development')
    with app.app_context():
        from app.routes.progress_routes import get_default_user
        
        user = get_default_user()
        
        # Get stats
        courses = Course.query.count()
        modules = Module.query.count()
        labs = Lab.query.count()
        
        completed_labs = Progress.query.filter_by(
            user_id=user.id,
            completed=True
        ).filter(Progress.lab_id.isnot(None)).count()
        
        overall_percent = round((completed_labs / labs * 100), 1) if labs > 0 else 0
        
        print_info(f"Courses: {courses}")
        print_info(f"Modules: {modules}")
        print_info(f"Labs: {labs}")
        print_info(f"Completed Labs: {completed_labs}")
        print_info(f"Overall Progress: {overall_percent}%")
        
        # Verify course breakdown
        course_list = Course.query.order_by(Course.order).all()
        completed_lab_ids = {
            row.lab_id for row in Progress.query.filter_by(
                user_id=user.id,
                completed=True
            ).filter(Progress.lab_id.isnot(None)).all()
        }
        
        print("\n📊 Course Breakdown:")
        for course in course_list:
            course_modules = Module.query.filter_by(course_id=course.id).all()
            course_lab_ids = []
            for mod in course_modules:
                course_lab_ids.extend([lab.id for lab in Lab.query.filter_by(module_id=mod.id).all()])
            
            course_completed = sum(1 for lid in course_lab_ids if lid in completed_lab_ids)
            course_total = len(course_lab_ids)
            course_percent = round((course_completed / course_total * 100), 1) if course_total > 0 else 0
            
            print(f"   {course.title}: {course_completed}/{course_total} labs ({course_percent}%)")
        
        print_success("\nAnalytics data verified")
        return True

def verify_markdown_file():
    """Verify the content markdown file exists"""
    print_header("Content File Verification")
    
    md_paths = [
        Path(__file__).parent / 'data' / 'PROGRESS_TRACKER_COMPLETE_CONTENT.md',
        Path(os.path.expanduser('~')) / 'Downloads' / 'PROGRESS_TRACKER_COMPLETE_CONTENT.md'
    ]
    
    found = False
    for md_path in md_paths:
        if md_path.exists():
            print_success(f"Content file found: {md_path}")
            
            # Check file size
            size_kb = md_path.stat().st_size / 1024
            print_info(f"File size: {size_kb:.1f} KB")
            
            # Check for PART headings
            content = md_path.read_text(encoding='utf-8')
            part_count = content.count('## PART')
            module_count = content.count('### MODULE')
            
            print_info(f"Found {part_count} PART sections")
            print_info(f"Found {module_count} MODULE sections")
            
            if part_count >= 4 and module_count >= 20:
                print_success("Content file appears complete")
            else:
                print_error("Content file may be incomplete")
            
            found = True
            break
    
    if not found:
        print_error("Content markdown file not found")
        print_info("Expected location: backend/data/PROGRESS_TRACKER_COMPLETE_CONTENT.md")
        return False
    
    return True

def main():
    """Run all verification checks"""
    print("\n" + "="*60)
    print("  DevOps Platform - Setup Verification")
    print("="*60)
    
    checks = [
        ("Markdown Content File", verify_markdown_file),
        ("Database", verify_database),
        ("Content Structure", verify_content_structure),
        ("Progress Tracking", verify_progress_tracking),
        ("Analytics Data", verify_analytics_data),
    ]
    
    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print_error(f"Error during {name} check: {str(e)}")
            results.append((name, False))
    
    # Summary
    print_header("Verification Summary")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
    
    print(f"\n{passed}/{total} checks passed")
    
    if passed == total:
        print_success("\n🎉 All checks passed! Your DevOps Platform is ready to use.")
        print_info("\nNext steps:")
        print_info("  1. Start backend: python run.py")
        print_info("  2. Start frontend: cd ../frontend && npm run dev")
        print_info("  3. Or use one-click launcher: start-desktop.bat")
        return 0
    else:
        print_error("\n⚠️  Some checks failed. Please review the errors above.")
        print_info("\nTo fix:")
        print_info("  1. Ensure PROGRESS_TRACKER_COMPLETE_CONTENT.md is in backend/data/")
        print_info("  2. Run: python run.py (to seed database)")
        print_info("  3. Run this script again: python verify_setup.py")
        return 1

if __name__ == '__main__':
    sys.exit(main())
