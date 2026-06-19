from datetime import datetime
from app import db

class User(db.Model):
    """User model for tracking progress"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    progress = db.relationship('Progress', backref='user', lazy=True, cascade='all, delete-orphan')

class Course(db.Model):
    """Course/Chapter model"""
    __tablename__ = 'courses'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    order = db.Column(db.Integer, default=0)
    modules = db.relationship('Module', backref='course', lazy=True, cascade='all, delete-orphan')

class Module(db.Model):
    """Module/Section within a course"""
    __tablename__ = 'modules'
    
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    content = db.Column(db.Text)
    order = db.Column(db.Integer, default=0)
    labs = db.relationship('Lab', backref='module', lazy=True, cascade='all, delete-orphan')
    quizzes = db.relationship('Quiz', backref='module', lazy=True, cascade='all, delete-orphan')
    projects = db.relationship('Project', backref='module', lazy=True, cascade='all, delete-orphan')

class Lab(db.Model):
    """Lab exercises"""
    __tablename__ = 'labs'
    
    id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey('modules.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    objective = db.Column(db.Text)
    steps = db.Column(db.Text)  # JSON stored as text
    expected_outcome = db.Column(db.Text)
    difficulty = db.Column(db.String(20), default='Intermediate')  # Beginner, Intermediate, Advanced
    order = db.Column(db.Integer, default=0)

class Resource(db.Model):
    """External resources and links"""
    __tablename__ = 'resources'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    resource_type = db.Column(db.String(50))  # Article, Video, Documentation, PDF
    source = db.Column(db.String(100))  # Website, YouTube, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Progress(db.Model):
    """User progress tracking"""
    __tablename__ = 'progress'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    module_id = db.Column(db.Integer, db.ForeignKey('modules.id'))
    lab_id = db.Column(db.Integer, db.ForeignKey('labs.id'))
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'))
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    completed = db.Column(db.Boolean, default=False)
    completion_date = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Quiz(db.Model):
    """Quiz model for module quizzes"""
    __tablename__ = 'quizzes'

    id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey('modules.id'), nullable=True)
    title = db.Column(db.String(255), nullable=False)
    questions = db.Column(db.Text)  # JSON list stored as text
    order = db.Column(db.Integer, default=0)


class Project(db.Model):
    """Project / deliverable model"""
    __tablename__ = 'projects'

    id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey('modules.id'), nullable=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    deliverables = db.Column(db.Text)
    order = db.Column(db.Integer, default=0)
