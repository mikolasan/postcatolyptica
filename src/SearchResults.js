import React, { Component } from 'react';
import { Alert, Badge, Row, Col, Card, CardImg, CardText, CardBody, CardTitle, CardSubtitle } from 'reactstrap';

class SearchResults extends Component {
  constructor(props) {
    super(props);
  }

  renderResults() {
    var results = this.props.getResults()
    console.log("renderResults", results)
    if (results.length === 0) {
      return <h2>Your search did not match any documents</h2>
    }
    return results.map(record => {
      console.log("renderResults", record)
      return (
        <Card>
          <CardBody>
            <CardTitle>
              <h2>
                {record.title}{' '}<Badge color="secondary">{record.totalScore}</Badge>
              </h2>
            </CardTitle>
            <CardSubtitle>Description</CardSubtitle>
            <CardText>{record.breed}</CardText>
            <CardSubtitle>Did you know?</CardSubtitle>
            <CardText>{record.did_you_know}</CardText>
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
