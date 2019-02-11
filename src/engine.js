import Natural from 'natural';
import PosTagger from 'wink-pos-tagger';
import Cats from './cats-db';

const bighugelabs_api_key = "f581f85818017fb699477035dfca9dd4"
const bighugelabs = `//words.bighugelabs.com/api/2/${bighugelabs_api_key}/`

let tagger = PosTagger();
let sentenceTokenizer  = new Natural.SentenceTokenizer()
let TermFrequency = Natural.TfIdf; // Term Frequency–Inverse Document Frequency
let termFrequency = new TermFrequency();


class CatSearchEngine {
  constructor() {
    this.prepareBase();
  }

  searchSynonym(word) {
    return Promise.resolve({noun:{syn:['apple']},verb:{syn:['drink']}})
    /*
    console.log(word)
    return fetch(bighugelabs + word + '/json')
    .then(response => {
      if (response.ok) {
        return response.json();
      } else if (response.status === 500) {
        throw 'The Big Huge Thesaurus said big and fluffy goodbuy';
      }
    })
    */
  }

  weightTokens(paragraph) {
    termFrequency.addDocument(paragraph);
    var sentences = sentenceTokenizer.tokenize(paragraph);
    var seen = new Set();
    var weightTasks = [];
    sentences.forEach(sentence => {
      var taggedSentence = tagger.tagSentence(sentence);
      console.log(taggedSentence)
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
        .then(data => {
          var synonyms = []
          if (token.pos.includes("NN")) {
            synonyms = data.noun.syn;
          } else if (token.pos.includes("VB")) {
            synonyms = data.verb.syn;
          }
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
      console.log("saveTokens", t.word, t.synonyms, words)
    }
    console.log("saveTokens", tokens, words)
    Cats[breed].words = words;
    return tokens;
  }

  prepareBase() {
    for (const [breed, details] of Object.entries(Cats)) {
      console.log(breed, details)
      let paragraph = details.size + ". " + details.coat + ". " + details.color + ". " + details.description + details.did_you_know
      this.weightTokens(paragraph)
      .then(weightedTokens => this.finalTokens(weightedTokens))
      .then(finalTokens => this.saveTokens(finalTokens, breed))
    }
  }

  scoreWords(a, b) {
    return Natural.JaroWinklerDistance(a, b);
  }

  search(query) {
    var result = []
    for (let breed in Cats) {
      let totalScore = 0;
      let tokens = Cats[breed].tokens;
      for (let t = 0; t < tokens.length; ++t) {
        let token = tokens[t];
        let wordScore = 0
        wordScore += this.scoreWords(query, token.word);
        for (let s = 0; s < token.synonyms.length; ++s) {
          let word = token.synonyms[s]
          wordScore += this.scoreWords(query, word);
        }
        token.wordScore = wordScore;
        totalScore += wordScore;
      }
      Cats[breed].totalScore = totalScore;
      Cats[breed].breed = breed;
      if (totalScore > 0) {
        result.push(Cats[breed]);
      }
    }
    return result.sort((a, b) => a.score < b.score).splice(0, 5)
  }
}

export default CatSearchEngine;
