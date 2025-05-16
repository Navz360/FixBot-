from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
import json
import openai
from difflib import get_close_matches
import re
import requests

app = Flask(__name__)
CORS(app)

# Load NLP model
nlp = spacy.load("en_core_web_sm")

# Load Q&A dataset
with open("dataset.json", "r", encoding="utf-8") as file:
    dataset = json.load(file)

# Set your OpenAI API key (optional, can be blank if not using)
openai.api_key = ""

# Set your SerpAPI key here
SERP_API_KEY = ""

# Preprocess text (remove punctuation, lowercase)
def clean_text(text):
    return re.sub(r'[^a-zA-Z0-9 ]', '', text.lower())

# Correct spelling using close matches
def correct_spelling(text):
    words = text.split()
    corrected_words = []
    vocab = set(word for entry in dataset for word in entry['question'].split())
    for word in words:
        match = get_close_matches(word, vocab, n=1, cutoff=0.75)
        corrected_words.append(match[0] if match else word)
    return ' '.join(corrected_words)

# NLP-based local similarity match
def get_best_match(user_input):
    user_input = correct_spelling(clean_text(user_input))
    user_doc = nlp(user_input)

    best_score = 0
    best_answer = None
    for entry in dataset:
        question_doc = nlp(clean_text(entry["question"]))
        score = user_doc.similarity(question_doc)
        if score > best_score:
            best_score = score
            best_answer = entry["answer"]

    return best_answer if best_score > 0.75 else None

# ChatGPT fallback
def get_openai_response(user_input):
    if not openai.api_key:
        return None
    print("\n🔁 [FIXBOT] OpenAI Fallback Triggered...\n")
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are FIXBOT 🤖, a helpful assistant for CNC and PC repair. You understand natural language and respond clearly with emojis."},
                {"role": "user", "content": user_input}
            ],
            max_tokens=150,
            temperature=0.7,
        )
        print("✅ [FIXBOT] OpenAI response received.\n")
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("❌ OpenAI error:", e)
        return None

# SerpAPI fallback

def get_google_serpapi_answer(query):
    print("🔍 [FIXBOT] Searching Google via SerpAPI...")
    try:
        url = "https://serpapi.com/search"
        params = {
            "q": query,
            "api_key": SERP_API_KEY,
            "hl": "en",
            "gl": "us"
        }
        res = requests.get(url, params=params)
        data = res.json()

        # Try answer box
        if "answer_box" in data:
            if "answer" in data["answer_box"]:
                return data["answer_box"]["answer"]
            elif "snippet" in data["answer_box"]:
                return data["answer_box"]["snippet"]

        # Try organic results
        if "organic_results" in data and len(data["organic_results"]) > 0:
            snippet = data["organic_results"][0].get("snippet")
            if snippet:
                return snippet

        return "Sorry, I couldn't find anything useful from Google 🔍"
    except Exception as e:
        print("❌ SerpAPI error:", e)
        return "Sorry, I'm unable to search Google right now."

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message")

    # 1. Try local NLP match
    response = get_best_match(user_message)
    if response:
        return jsonify({"response": response})

    # 2. Fallback to OpenAI
    response = get_openai_response(user_message)
    if response:
        return jsonify({"response": response})

    # 3. Fallback to Google via SerpAPI
    response = get_google_serpapi_answer(user_message)
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(debug=True)
