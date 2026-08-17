import pymysql

try:
    conn = pymysql.connect(
        host='localhost',
        user='root',
        password='',
        database='pfe_crm_ia',
        autocommit=True
    )
    cursor = conn.cursor()
    
    print("Connexion réussie.")
    
    # Suppression si existante (test)
    cursor.execute("DROP TABLE IF EXISTS users")
    
    # Création
    sql = """
    CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        role VARCHAR(20),
        email VARCHAR(120),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """
    cursor.execute(sql)
    print("Table 'users' créée.")
    
    # Insertion
    cursor.execute("INSERT INTO users (username, password, name, role, email) VALUES ('admin', 'admin123', 'Administrateur', 'admin', 'admin@crm-ai.com')")
    print("Admin inséré.")
    
    cursor.execute("SHOW TABLES")
    print("Tables actuelles:", cursor.fetchall())
    
    conn.close()
except Exception as e:
    print(f"Erreur: {e}")
