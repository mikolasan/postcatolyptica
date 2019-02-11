import React, { Component } from 'react';
import { Alert, Badge, Row, Col, Card, CardImg, CardText, CardBody, CardTitle, CardSubtitle } from 'reactstrap';

class SearchResults extends Component {

  renderResults() {
    var results = this.props.getResults()
    if (results.length === 0) {
      return <h2>Your search did not match any documents</h2>
    }
    return results.map(record => {
      var title = (
        <h2>
          {record.title.excerpt1}<strong>{record.title.highlightWord}</strong>{record.title.excerpt2}{' '}<Badge color="secondary">{record.totalScore}</Badge>
        </h2>
      )
      return (
        <Card>
          <CardBody>
            <CardTitle>
              {title}
            </CardTitle>
            <CardText>{record.breed}</CardText>
          </CardBody>
        </Card>
      )
    })
  }

  render() {
    if (!this.props.visible) {
      return null
    } else {
      return  (
        <div>
          <Row>
            <Col sm={{ size: 6, offset: 1 }}>
              <h4>Search results</h4>
            </Col>
          </Row>
          <Row>
            <Col sm={{ size: 6, offset: 1 }}>
              {this.renderResults()}
            </Col>
          </Row>
        </div>
      )
    }
  }
}

export default SearchResults;
