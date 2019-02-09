import Natural from 'natural';
import React, { Component } from 'react';
import { Alert, Button, ListGroup, ListGroupItem, ListGroupItemHeading, ListGroupItemText } from 'reactstrap';
import RDFStore from 'rdfstore';
import Feature from './Feature';
import Pos from 'pos';

const bighugelabs_api_key = "f581f85818017fb699477035dfca9dd4"
const bighugelabs = `//words.bighugelabs.com/api/2/${bighugelabs_api_key}/`


let sentenceTokenizer  = new Natural.SentenceTokenizer()
let wordTokenizer  = new Natural.WordTokenizer()
let TfIdf = Natural.TfIdf; // Term Frequency–Inverse Document Frequency
let tfidf = new TfIdf();
// const language = "EN"
// const defaultCategory = 'N';
// var lexicon = new Natural.Lexicon(language, defaultCategory);
// var ruleSet = new Natural.RuleSet(language);
// var tagger = new Natural.BrillPOSTagger(lexicon, ruleSet);
let catStore;
const notSelectedValue = "-- I don't know --";
const ontologyURL = 'https://gist.githubusercontent.com/mikolasan/a25dd94c1aea9c8fcba77bc0f77fe252/raw/6bab5b3fb4c31a4d29423ceafea1d6ad4fe31771/cat-beeds-list-wikipedia-output-standard.ttl'
const sampleText = 'The American Wirehair was discovered in 1966 from a mating of two ordinary barn cats in upstate New York. A spontaneous, incomplete dominant gene mutation occurred in a red-and-white male kitten, named Council Rock Farm Adam of Hi-Fi, which resulted in the wiry coat for which the breed is known.'
//'The Turkish Angora may have been the first longhair cat in Europe and is believed to have descended from longhair cats in Turkey, Russia and Persia. The breed is named for the former Turkish capital of Angora, today known as Ankara.'

class Filter extends Component {
  constructor(props) {
    super(props);
    this.features = {}
    this.options = {}
    this.state = {
      errorMessage: null,
      notification: null,
    };
  }

  componentDidMount() {
    fetch(ontologyURL)
    .then(response => response.text())
    .then(str => {
      this.loadOntology(str)
    })
  }

  loadOntology(str) {
    new RDFStore.Store((err, store) => {
      if (err) {
        this.showError(err)
        return
      }
      catStore = store;
      catStore.load('text/turtle', str, (notification, nTriples) => {
        if (notification) {
          this.showNotification(notification)
        } else {
          Promise.all([
            this.selectAllOptions("Origin"),
            this.selectAllOptions("Country"),
            this.selectAllOptions("Body_type"),
            this.selectAllOptions("Coat"),
            this.selectAllOptions("Pattern")
          ])
          .then(() => this.setState(this.state))
        }
      })
    })
  }

  formQuestion() {
    if (!catStore) {
      this.showError("no catStore")
      return
    }
    var whereClause = []
    for (const [key, value] of Object.entries(this.features)) {
      whereClause.push(`?breed <http://neuron.co.nf/cats#_${key}> "${value}"`)
    }
    const query =
      `SELECT ?breed ?country ?origin
      WHERE { ${whereClause.join(' . ')} .
        OPTIONAL {
          ?breed <http://neuron.co.nf/cats#_Country> ?country .
          ?breed <http://neuron.co.nf/cats#_Origin> ?origin
        }
      }`
    catStore.execute(query, (err, results) => {
      if (err) {
        this.showError(err)
      } else {
        //console.log(query, results)
        if (results.length > 0) {
          var html = []
          for (let i = 0; i < results.length; ++i) {
            const uri = results[i]['breed'].value
            const regex = /.*\/(.*)/
            const breed = regex.exec(uri)[1].replace(/\+/g, ' ')
            const country = results[i]['country']? results[i]['country'].value : "?"
            const origin = results[i]['origin']? results[i]['origin'].value : "?"
            html.push((
              <ListGroupItem>
                <ListGroupItemHeading>{breed}</ListGroupItemHeading>
                <ListGroupItemText>
                  <p>
                    Origin: {origin}<br />
                    Country: {country}
                  </p>
                </ListGroupItemText>
              </ListGroupItem>
            ))
          }
          this.showResults(html)
        } else {
          this.showResults("")
          this.showNotification("There is no such cat breed that would satisfy to the current criteria.")
        }

      }
    })
  }

  selectAllOptions(feature) {
    return new Promise((resolve, reject) => {
      if (!catStore) {
        this.showError("no catStore")
        reject()
        return
      }
      const query =
        `SELECT DISTINCT ?value
        WHERE { ?x <http://neuron.co.nf/cats#_${feature}> ?value }`
      catStore.execute(query, (err, results) => {
        if (err) {
          this.showError(err)
          reject()
        } else {
          this.options[feature] = [notSelectedValue]
          if (results.length > 0) {
            for (let i = 0; i < results.length; ++i) {
              const option = results[i]['value'].value
              this.options[feature].push(option)
            }
          }
          resolve()
        }
      })
    })
  }

  getOptions(feature) {
    return this.options[feature] || [notSelectedValue]
  }

  showNotification(msg) {
    this.setState({notification: <Alert color="warning">{"Info: " + msg}</Alert>})
  }

  showError(msg) {
    this.setState({errorMessage: <Alert color="danger">{"Error: " + msg}</Alert>})
  }

  showResults(results) {
    this.setState({
      errorMessage: null,
      notification: null,
      results: results
    })
  }

  clearResults() {
    this.setState({
      errorMessage: null,
      notification: null,
      results: ""
    })
  }

  updateQuestion() {
    var question = null
    //"What is a cat breed ?"
    if (question) {
      this.setState({quetion: <Alert color="primary">{question}</Alert>})
    }
  }

  handleFeatureSelection(feature) {
    return (newValue) => {
      if (newValue) {
        this.features[feature] = newValue;
      } else {
        delete this.features[feature];
      }
    }
  }

  searchSynonym(word) {
    fetch(bighugelabs + word + '/json')
    .then(response => response.json())
  }

  synonymsNoun(word) {
    return this.searchSynonym(word).then((data) => data.noun.syn);
  }

  synonymsVerb(word) {
    return this.searchSynonym(word).then((data) => data.verb.syn);
  }

  synonyms(word) {
    return this.searchSynonym(word).then((data) => data.noun.syn.concat(data.verb.syn));
  }

  runTokenizer(paragraph) {
    var words = new Pos.Lexer().lex(sampleText);
    var tagger = new Pos.Tagger();
    var taggedWords = tagger.tag(words);

    tfidf.addDocument(sampleText);
    var sentences = sentenceTokenizer.tokenize(sampleText);
    var seen = new Set();
    var weightTasks = [];
    sentences.forEach(sentence => {
      var tokens = wordTokenizer.tokenize(sentence)
      //var taggedSentence = tagger.tag(tokens);
      //console.log(taggedSentence)
      tokens.forEach((word, pos) => {
        if (seen.has(word))
          return
        seen.add(word);

        for (let i in taggedWords) {
            var taggedWord = taggedWords[i];
            var w = taggedWord[0];
            var tag = taggedWord[1];
            console.log(w + " /" + tag);
        }
        //let tag = taggedSentence.taggedWords[pos].tag;
        //console.log(word, Natural.PorterStemmer.stem(word), Natural.LancasterStemmer.stem(word))
        let synonyms = undefined;
        // syn.synonyms(word).then((data) => {
        //   console.log(data);
        // });
        //
        // syn.synonymsNoun(word).then((data) => {
        //   console.log(data);
        // });
        //
        // syn.synonymsVerb(word).then((data) => {
        //   console.log(data);
        // });
        if (typeof synonyms === "object") {
          if (synonyms.hasOwnProperty("synonyms")) {
            synonyms = synonyms.synonyms
          } else {
            synonyms = undefined
          }
        } else {
          synonyms = undefined
        }

        let weightTask = new Promise(resolve => {
          tfidf.tfidfs(word, (i, measure) => {
            resolve({word: word, synonyms: synonyms, weight: measure})
          })
        });
        weightTasks.push(weightTask);
      });
    })
    var html = [];
    Promise.all(weightTasks)
    .then((weightedTokens) => {
      weightedTokens.sort((first, second) => first.weight < second.weight)
      for (let i = 0; i < weightedTokens.length; ++i) {
        html.push((
          <p>
            {weightedTokens[i].word}: [{weightedTokens[i].synonyms? weightedTokens[i].synonyms.join(',') : '??'}] ({weightedTokens[i].weight})
          </p>
        ));
      }
      this.showResults(html);
    })
  }

  render() {
    return (
      <React.Fragment>
        <Feature onSelected={this.handleFeatureSelection("Body_type")} title="Body type" options={this.getOptions("Body_type")} />
        <Feature onSelected={this.handleFeatureSelection("Coat")} title="Coat" options={this.getOptions("Coat")} />
        <Feature onSelected={this.handleFeatureSelection("Pattern")} title="Pattern" options={this.getOptions("Pattern")} />
        <p>
          <Button color="primary" onClick={() => this.formQuestion()}>Find a breed</Button>{' '}
          <Button color="warning" onClick={() => this.clearResults()}>Clear Results</Button>
        </p>
        <Button color="primary" onClick={() => this.runTokenizer()}>Run tokenizer</Button>
        {this.state.errorMessage}
        {this.state.notification}
        {this.state.question}
        <ListGroup>
          {this.state.results}
        </ListGroup>
      </React.Fragment>
    )
  }
}

export default Filter;
