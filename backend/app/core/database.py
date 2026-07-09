import os
from neo4j import GraphDatabase
from backend.app.core.config import settings

class Neo4jConnection:
    def __init__(self):
        self._driver = None

    def connect(self, uri: str, user: str, password: str):
        try:
            self._driver = GraphDatabase.driver(uri, auth=(user, password))
        except Exception as e:
            # We log but don't crash if Neo4j is not running locally during development
            print(f"Neo4j connection error: {e}")
            self._driver = None

    def close(self):
        if self._driver is not None:
            self._driver.close()
            self._driver = None

    def get_session(self):
        if self._driver is None:
            return None
        return self._driver.session()

db_conn = Neo4jConnection()

def init_db():
    uri = settings.NEO4J_URI
    username = settings.NEO4J_USERNAME or os.getenv("NEO4J_USER", "neo4j")
    password = settings.NEO4J_PASSWORD
    db_conn.connect(uri, username, password)
