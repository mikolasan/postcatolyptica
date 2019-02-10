import React, { Component } from 'react';
import { Container, Col, Row, Button, Input} from 'reactstrap';

class SearchResults extends Component {
  constructor(props) {
    super(props);
    this.input = React.createRef();
  }
  
  render() {
    return (
      <Container fluid>
        <Row>
          <Col sm="12" md={{ size: 4, offset: 4 }}>
            <h1>PostCAToliptica</h1>
          </Col>
        </Row>
        <Row>
          <Col sm="10" md={{ size: 8, offset: 1 }}>
            <Input innerRef={this.input} bsSize="lg" type="text" name="searchBar" id="bar" placeholder="type any word here" />
          </Col>
          <Col sm="2" md={{ size: 2, offset: 0 }}>
            <Button type="submit" size="lg" onClick={() => this.startSearch()}>Search</Button>
          </Col>
        </Row>
      </Container>
    )
  }
}

export default SearchResults;