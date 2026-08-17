import random
from datetime import datetime, timedelta
from models.database import insert_call, create_db

create_db()

agents = ["Ali", "Sana", "Omar", "Mariam", "Youssef"]

calls_data = [
    ("client satisfait merci beaucoup", "POSITIVE"),
    ("problème de livraison très en colère", "NEGATIVE"),
    ("demande information produit", "NEUTRAL"),
    ("rappel pour un rendez-vous", "NEUTRAL"),
    ("annulation de commande", "NEGATIVE"),
    ("service excellent bravo", "POSITIVE"),
    ("réclamation sur la facture", "NEGATIVE"),
    ("client content du service", "POSITIVE")
]

for i in range(50):

    agent = random.choice(agents)
    text, sentiment = random.choice(calls_data)

    score = random.randint(30, 100)

    # score sentiment réaliste
    if sentiment == "NEGATIVE":
        sentiment_score = random.uniform(0.1, 0.4)
    elif sentiment == "POSITIVE":
        sentiment_score = random.uniform(0.7, 1.0)
    else:
        sentiment_score = random.uniform(0.4, 0.6)

    # type appel
    if "rendez" in text or "rdv" in text:
        call_type = "RDV"
    elif "problème" in text or "réclamation" in text:
        call_type = "Réclamation"
    else:
        call_type = "Information"

    # problème client
    problem = "Oui" if sentiment == "NEGATIVE" else "Non"

    # mots clés
    keywords = []
    if "problème" in text:
        keywords.append("problème")
    if "rappel" in text:
        keywords.append("rappel")

    # date aléatoire
    call_time = datetime.now() - timedelta(minutes=random.randint(0, 3000))

    insert_call({
        "agent_name": agent,
        "audio_path": "audio/test.mp3",
        "transcription": text,
        "sentiment": sentiment,
        "sentiment_score": sentiment_score,
        "score_percentage": score,
        "performance": "",
        "summary": text[:50],
        "keywords": str(keywords),
        "call_type": call_type,
        "problem": problem,
        "call_time": call_time
    })

print(" 50 appels ajoutés dans la base !")