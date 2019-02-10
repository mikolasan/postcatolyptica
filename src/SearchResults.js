import React, { Component } from 'react';
import { TabContent, TabPane, Nav, NavItem, NavLink, Badge, Row, Col, Card, CardImg, CardText, CardBody, CardTitle, CardSubtitle } from 'reactstrap';
import classnames from 'classnames';

class SearchResults extends Component {
  constructor(props) {
    super(props);
    this.input = React.createRef();
  }

  renderResults() {
    var results = this.props.getResults()
    console.log("renderResults", results)
    return results.map(record => {
      console.log("renderResults", record)
      return (
        <Card>
          <CardBody>
            <CardTitle>
              <h2>
                {record.breed}{' '}<Badge color="secondary">{record.score}</Badge>
              </h2>
            </CardTitle>
            <CardSubtitle>Description</CardSubtitle>
            <CardText>{record.description}</CardText>
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
            <Col sm="12">
              <h4>Search results</h4>
            </Col>
          </Row>
          <Row>
            {this.renderResults()}
          </Row>
        </div>
      )
    }
  }
}

export default SearchResults;
