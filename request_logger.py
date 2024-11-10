import firebase_admin
from datetime import datetime
from firebase_admin import credentials, firestore

class RequestLogger:
    def __init__(self):
        if not firebase_admin._apps:
        # Initialize Firebase Admin SDK
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred)
        self.db = firestore.client()
        self.project_id = firebase_admin.get_app().project_id
        print(f"Using Firebase project: {self.project_id}")


    def log_request(self, request_type, content, response=None, metadata=None):
        print("Logging request: "+request_type)
        doc_ref = self.db.collection('requests').document()
        doc_data = {
            'timestamp': datetime.utcnow(),
            'type': request_type,
            'content': content,
            'response': response,
            'metadata': metadata or {}
        }
        doc_ref.set(doc_data)