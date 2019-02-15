import React, { Component } from 'react';
import TitlePage from './TitlePage';
import SearchResults from './SearchResults';
import Engine from './engine';

let engine = null;
let engineReady = false;

class PostCAToliptica extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showResults: false
    }
  }

  componentDidMount() {
    engine = new Engine((err, data) => {
      if (!err) {
        engineReady = true;
      } else {
        console.log(err)
      }
    });
  }

  searchPressed(query) {
    if (query.length > 0 && engineReady) {
      let results = engine.search(query);
      console.log("searchPressed", query, results.length)
      this.setState({
        showResults: true,
        results: results
      })
    }
  }

  getResults() {
    return this.state.results
  }

  render() {
    return (
      <React.Fragment>
        <TitlePage onSearchStarted={(query) => this.searchPressed(query)} />
        <SearchResults visible={this.state.showResults} getResults={() => this.getResults()}/>
      </React.Fragment>
    )
  }
}

export default PostCAToliptica;
