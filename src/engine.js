import Natural from 'natural';
import Pos from 'pos';
import Cats from './cats-db.json';
import Synonyms from './synonyms.json';

let tagger = new Pos.Tagger();
let sentenceTokenizer  = new Natural.SentenceTokenizer();
let wordTokenizer = new Natural.WordTokenizer();
let TermFrequency = Natural.TfIdf; // Term Frequency–Inverse Document Frequency
let termFrequency = new TermFrequency();


class CatSearchEngine {
  constructor(callback) {
    this.prepareBase(callback);
  }

  extractModelWords(taggedWords) {
    var seen = new Set();
    return taggedWords.filter(token => {
      var word = token[0];
      var pos = token[1];
      if (seen.has(word))
        return false;
      if (!pos.includes("NN") && !pos.includes("VB"))
        return false;
      seen.add(word);
      return true;
    })
    .map(token => {
      return {word: token[0], pos: token[1]};
    });
  }

  preProcessText() {
    var paragraphId = 0;
    for (let [breed, details] of Object.values(Cats)) {
      let paragraph = details.size + ". " + details.coat + ". " + details.color + ". " + details.description + details.did_you_know;
      termFrequency.addDocument(paragraph);
      Cats[breed].paragraphId = paragraphId;
      Cats[breed].paragraph = paragraph;
      let sentencesRaw = sentenceTokenizer.tokenize(paragraph);
      Cats[breed].model = {};
      Cats[breed].sentences = sentencesRaw.map(sentence => {
        var words = wordTokenizer.tokenize(sentence);
        var taggedSentence = tagger.tag(words);
        var modelWords = this.extractModelWords(taggedSentence);
        modelWords.forEach(token => {
          Cats[breed].model[token.word] = token;
        });
        return {
          text: sentence,
          words: words,
          modelWords: modelWords
        };
      });
      ++paragraphId;
    }
  }

  weightTokens() {
    for (let breed in Cats) {
      let details = Cats[breed];
      for (let word in details.model) {
        details.model[word].weight = termFrequency.tfidf(word, details.paragraphId);
        details.model[word].synonyms = Synonyms[word] || [];
      }
    }
  }

  prepareBase(callback) {
    this.preProcessText();
    this.weightTokens();
    callback();
  }

  scoreWords(array, word) {
    var score = 0;
    for (let i = 0; i < array.length; ++i) {
      score = 1/(Natural.LevenshteinDistance(array[i], word)+0.000001);
    }
    return score;
    //return Natural.JaroWinklerDistance(a, b) > 0.5? 1 : 0;
  }

  highlightWord(sentence, word) {
    var index = sentence.indexOf(word);
    if (index !== -1) {
      const neighborhoodSymbols = 30;
      var startPos = sentence.indexOf(" ", index - neighborhoodSymbols);
      var endPos = sentence.indexOf(" ", index + word.length + neighborhoodSymbols);
      var prefix = "", suffix = "";
      if (startPos > index || startPos < 0) {
        startPos = 0;
      } else {
        prefix = "...";
      }
      if (endPos < index || endPos > sentence.length) {
        endPos = undefined;
      } else {
        suffix = "...";
      }
      var shortString = prefix + sentence.slice(startPos, endPos) + suffix;
      var shortIndex = shortString.indexOf(word);
      return {
        index: shortIndex,
        excerpt: shortString,
        highlightWord: word,
        excerpt1: shortString.slice(0, shortIndex),
        excerpt2: shortString.slice(shortIndex + word.length)
      };
    } else {
      return null;
    }
  }

  search(query) {
    var queryWords = wordTokenizer.tokenize(query);
    var result = [];
    for (let breed in Cats) {
      let totalScore = 0;
      let data = Cats[breed];
      let tokens = data.model;
      let spotlight = {score: 0, word: ""};
      for (let t in tokens) {
        let token = tokens[t];
        let wordScore = 0;
        wordScore += this.scoreWords(queryWords, token.word);
        for (let s = 0; s < token.synonyms.length; ++s) {
          let word = token.synonyms[s];
          wordScore += this.scoreWords(queryWords, word);
        }
        token.wordScore = wordScore;
        totalScore += wordScore;
        if (wordScore > 0 && wordScore > spotlight.score) {
          spotlight.score = wordScore;
          spotlight.word = token.word;
        }
      }
      data.totalScore = totalScore;
      if (totalScore > 0) {
        data.title =
          this.highlightWord(data.did_you_know, spotlight.word) ||
          this.highlightWord(data.description, spotlight.word) ||
          this.highlightWord(data.size, spotlight.word) ||
          this.highlightWord(data.coat, spotlight.word) ||
          this.highlightWord(data.color, spotlight.word) ||
          this.highlightWord(data.did_you_know, tokens[0].word) ||
          this.highlightWord(data.description, tokens[0].word) ||
          this.highlightWord(data.size, tokens[0].word) ||
          this.highlightWord(data.coat, tokens[0].word) ||
          this.highlightWord(data.color, tokens[0].word);
        console.log('search', totalScore, spotlight, data.title, data);
        result.push(data);
      }
    }
    return result.sort((a, b) => a.totalScore < b.totalScore).splice(0, 5);
  }
}

export default CatSearchEngine;
