import React, { Component } from 'react';
import TitlePage from './TitlePage';
import SearchResults from './SearchResults';
import Engine from './engine';

let engine = new Engine();

class PostCAToliptica extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showResults: false
    }
  }

  componentDidMount() {
  }

  searchPressed(query) {
    if (query.length > 0) {
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
