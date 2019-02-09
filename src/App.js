import React, { Component } from 'react';
import Filter from './Filter';
import './App.css';

class App extends Component {
  render() {
    return (
      <React.Fragment>
        <h1>Cat Bible</h1>
        <Filter />
      </React.Fragment>
    );
  }
}

export default App;
