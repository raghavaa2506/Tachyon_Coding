import re
def read_corpus(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read().lower()
    words = re.findall(r"\b\w+\b", text)
    return words
def build_vocab(words):
    vocab = {"UNK": 0} 
    for word in words:
        if word not in vocab:
            vocab[word] = len(vocab)
    return vocab
def sentence_to_vector(sentence, vocab):
    words = re.findall(r"\b\w+\b", sentence.lower())
    vector = [0] * len(vocab)
    for word in words:
        if word in vocab:
            vector[vocab[word]] = 1  
        else:
            vector[vocab["UNK"]] = 1 
    return vector
if __name__ == "__main__":

    corpus_file = "corpus.txt"
    words = read_corpus(corpus_file)

    vocab = build_vocab(words)
    print(f"Vocabulary size (including UNK): {len(vocab)}")

    test_sentences = [
        "The quick! brown fox jumps",
        "An unknownword appears here",
        "Machine learning with python",
        "This corpus is really large",
        " I love listening to music"
    ]

    for i in test_sentences:
        vec = sentence_to_vector(i, vocab)
        print(f"\nSentence: {i}")
        print("Vector:", vec)
