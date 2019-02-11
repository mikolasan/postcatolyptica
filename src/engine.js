import Natural from 'natural';
import PosTagger from 'wink-pos-tagger';
import Cats from './cats-db.json';
import Synonyms from './synonyms.json';

let tagger = PosTagger();
let sentenceTokenizer  = new Natural.SentenceTokenizer()
let wordTokenizer = new Natural.WordTokenizer()
let TermFrequency = Natural.TfIdf; // Term Frequency–Inverse Document Frequency
let termFrequency = new TermFrequency();


class CatSearchEngine {
  constructor() {
    this.prepareBase();
  }

  searchSynonym(word) {
    return Promise.resolve(Synonyms[word] || [])
  }

  weightTokens(paragraph) {
    termFrequency.addDocument(paragraph);
    var sentences = sentenceTokenizer.tokenize(paragraph);
    var seen = new Set();
    var weightTasks = [];
    sentences.forEach(sentence => {
      var taggedSentence = tagger.tagSentence(sentence);
      taggedSentence.forEach(token => {
        var word = token.value;
        var pos = token.pos;
        if (token.tag !== "word" || seen.has(word))
          return
        if (!pos.includes("NN") && !pos.includes("VB"))
          return
        seen.add(word);
        let weightTask = new Promise(resolve => {
          termFrequency.tfidfs(word, (i, weight) => {
            resolve({word: word, pos: pos, weight: weight})
          })
        });
        weightTasks.push(weightTask);
      });
    })
    return Promise.all(weightTasks);
  }

  finalTokens(weightedTokens) {
    var self = this;
    var synonymTasks = [];
    weightedTokens.sort((first, second) => first.weight < second.weight)
    var valuableTokens = weightedTokens//.filter(token => token.weight > 0).slice(0, 10)
    for (let i = 0; i < valuableTokens.length; ++i) {
      let token = valuableTokens[i]
      var synonymTask = new Promise(resolve => {
        self.searchSynonym(token.word)
        .then(synonyms => {
          token.synonyms = synonyms;
          resolve(token)
        })
        .catch(err => resolve(token))
      })
      synonymTasks.push(synonymTask)
    }
    return Promise.all(synonymTasks);
  }

  saveTokens(tokens, breed) {
    Cats[breed].tokens = tokens;
    var words = [];
    for (let i = 0; i < tokens.length; ++i) {
      let t = tokens[i];
      words.push(t.word)
      words = words.concat(t.synonyms)
    }
    Cats[breed].words = words;
    return tokens;
  }

  prepareBase() {
    for (const [breed, details] of Object.entries(Cats)) {
      let paragraph = details.size + ". " + details.coat + ". " + details.color + ". " + details.description + details.did_you_know
      this.weightTokens(paragraph)
      .then(weightedTokens => this.finalTokens(weightedTokens))
      .then(finalTokens => this.saveTokens(finalTokens, breed))
    }
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
    var index = sentence.indexOf(word)
    if (index !== -1) {
      const neighborhoodSymbols = 30
      var startPos = sentence.indexOf(" ", index - neighborhoodSymbols);
      var endPos = sentence.indexOf(" ", index + word.length + neighborhoodSymbols);
      var prefix = "", suffix = ""
      if (startPos > index || startPos < 0) {
        startPos = 0
      } else {
        prefix = "..."
      }
      if (endPos < index || endPos > sentence.length) {
        endPos = undefined
      } else {
        suffix = "..."
      }
      var shortString = prefix + sentence.slice(startPos, endPos) + suffix;
      var shortIndex = shortString.indexOf(word);
      return {
        index: shortIndex,
        excerpt: shortString,
        highlightWord: word,
        excerpt1: shortString.slice(0, shortIndex),
        excerpt2: shortString.slice(shortIndex + word.length)
      }
    } else {
      return null
    }
  }

  search(query) {
    var queryWords = wordTokenizer.tokenize(query);
    var result = [];
    for (let breed in Cats) {
      let totalScore = 0;
      let data = Cats[breed]
      let tokens = data.tokens;
      let spotlight = {score: 0, word: ""};
      for (let t = 0; t < tokens.length; ++t) {
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
      data.breed = breed;
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
          this.highlightWord(data.color, tokens[0].word)
        console.log('search', totalScore, spotlight, data.title, data)
        result.push(data);
      }
    }
    return result.sort((a, b) => a.totalScore < b.totalScore).splice(0, 5);
  }
}

export default CatSearchEngine;
