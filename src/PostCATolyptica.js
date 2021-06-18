//vim :set ts=2 sw=2 sts=2 et :

import React, { Component } from 'react';
import TitlePage from './TitlePage';
import SearchResults from './SearchResults';


class PostCATolyptica extends Component {
  constructor(props) {
    super(props);
    this.host = 'https://postcatolyptica.netlify.app'
    //this.host = 'http://localhost:4000'
    this.state = {
      showResults: false
    }
  }

  searchPressed(query) {
    if (query.length > 0) {
      fetch(`${this.host}/api/search?q=${query}`)
		.then(res => res.json())
		.then(results => {
		  console.log("searchPressed", query, results.length)
		  this.setState({
			showResults: true,
			results: results
		  })
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

export default PostCATolyptica;
