import React, { Component } from 'react';
import { Container, Col, Row, Button, Input} from 'reactstrap';
import TitlePage from './TitlePage';
import SearchResults from './SearchResults';

class PostCAToliptica extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showResults: false
    }
    
  }
  
  searchPressed(query) {
    
  }

  render() {
    return (
      <TitlePage onSearchStarted={(query) => this.searchPressed(query)} />
      <SearchResults visible={this.state.showResults}>
    )
  }
}

export default PostCAToliptica;