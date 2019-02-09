import React, { Component } from 'react';

const notSelectedValue = "-- I don't know --";

class Feature extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: notSelectedValue
    };
    
    this.handleChange = this.handleChange.bind(this);
  }

  renderOptions(options) {
    return options.map(x => {
      return <option value={x}>{x}</option>
    })
  }

  handleChange(event) {
    var newValue = event.target.value;
    this.props.onSelected(newValue === notSelectedValue? null : newValue);
    this.setState({value: newValue});
  }

  render() {
    return (
      <React.Fragment>
        <p>{this.props.title}   <select value={this.state.value} onChange={this.handleChange}>
          {this.renderOptions(this.props.options)}
        </select>
        </p>
      </React.Fragment>
    )
  }
}

export default Feature;