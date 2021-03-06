import React, { Component } from 'react';
import uuid from 'uuid/v4';
import styled from 'styled-components';
import { DragDropContext } from 'react-beautiful-dnd';
import { getResults, retrieveCircuits } from '../circuit/apicaller';
import Alert from 'react-bootstrap/Alert';
import { Form, Button, Label } from 'react-bootstrap';

// Main components
import NavBar from "../components/navBar.js";
import Algorithm from './algorithm_maker';
import Results from '../components/results';


import {getCircuitInput, fixAlgorithm, verifyCircuit, getStudentIDView, getUserID, getAlgorithmName, getIsGraded, getGrade } from './functions';
import { gradeCircuit } from './apicaller';

const Content = styled.div`
  margin-right: 10%;
`;

const Title = styled.h3`
  margin: 8px;
  padding-top: 10px;
  padding-left: 10px;
`;


//This save the algorithm the user creates as an array
var algorithm = [];
var lineArray = [];
var algor = JSON.parse(localStorage.getItem('algorithm'));

const getItems = (i) => {
  if (algor === null) { return []; }
  var ciruit = algor[i];
  var array = [];
  ciruit.map(function (item) {
    array.push(item);
  });
  return array;
}

export default class AdminDND extends Component {

  //This just sets the state of the list
  constructor(props) {
    super(props);

    var id = uuid();
    this.state = {
      canvas: {
        [id]: []
      },
      results: {},
      is_submitted: false,
      circuit_valid_msg: verifyCircuit(algorithm),
      is_graded: getIsGraded(),
      grade: getGrade(),
      student_id: 0,
      is_admin: true,
    };

    lineArray[0] = [0, id];
    algorithm[0] = [];
    this.onLoad = this.onLoad.bind(this);
    this.getCircuit = this.getCircuit.bind(this);
  }

  componentDidMount() {
    let circuit_name = getAlgorithmName();
    const is_admin = parseInt(localStorage.getItem('is_admin'));
    if (!is_admin) window.location.href = '/';
    else {
      const token = localStorage.token;
      this.getCircuit();
      this.calculateResults();
      let student_id = getStudentIDView();
      this.setState({student_id: student_id, algorithm_name: circuit_name});
    }
  }

  onLoad = () => {
    var id = lineArray[0][1];
    this.setState({ canvas: { [id]: getItems(0) } });
    algorithm[0] = getItems(0);

    if (algor === null) { return; }
    else {
      var length = algor.length;

      for (var j = 1; j < length; j++) {
        var id = uuid();
        let newCanvas = this.state.canvas;
        newCanvas[id] = getItems(j);
        this.setState({ canvas: newCanvas });
        lineArray[lineArray.length] = [lineArray.length, id];
        algorithm[algorithm.length] = getItems(j);
      }
      this.calculateResults();
    }
  }

  getCircuit = async () => {
    let student_id = getStudentIDView();
    let circuit_name = getAlgorithmName();
    retrieveCircuits({'student_id': student_id, 'circuit_name': circuit_name}).then(results => {
      //console.log("re:",results);
      let resultsJSON = JSON.parse(results['circuits'][0].circuit_input);
      var new_algorithm = [];
      for(var i = 0; i < resultsJSON.length; i++) {
        new_algorithm[i] = resultsJSON[i];
      }
      localStorage.setItem('algorithm', JSON.stringify(new_algorithm));
      this.calculateResults();
      fixAlgorithm();
      algor = JSON.parse(localStorage.getItem('algorithm'));
      this.onLoad();
      //console.log(algor)
    }).catch(error => {
      alert("This algorithm was not saved properly. Please contact the student.");
      window.location.href = '/admin';
    });

  }

  calculateResults = () => {
    let circuit_input = getCircuitInput(algorithm);
    let valid_msg = verifyCircuit(algorithm)
    getResults(circuit_input).then(res => {
      this.setState({ results: res, circuit_valid_msg: valid_msg });
    });
    this.forceUpdate();
  }

  onChangeGrade = (e) => {
   this.setState({
       grade: e.target.value
   });
  }


  Submit = (e) => {
    e.preventDefault();
    let student_id = getStudentIDView();
    let circuit_name = getAlgorithmName();
    if(this.state.grade > 100 || this.state.grade < 0 || this.state.grade == null) {
      alert('Please enter a valid grade' );
      return;
    }
    gradeCircuit(student_id, circuit_name, this.state.grade)
      .then(res => {
        this.setState({is_graded: true});
      });
  }

  resetMark = (e) => {
    e.preventDefault();
    this.setState({is_graded: false});
  }

  // Normally you would want to split things out into separate components.
  // But in this example everything is just done in one place for simplicity
  render() {

    if (this.state.student_id) {
      return (
        <div className="App">
          <NavBar />
          <body onLoad={this.onLoad} style={{overflow: 'hidden'}}>
            <DragDropContext>
              <div class="row">
                <div class="col">
                  <Content>
                    <Title>You are marking <b>{this.state.student_id}</b>'s algorithm: <b>{this.state.algorithm_name}</b></Title>
                    <div hidden={this.state.is_graded} class="row" style={{ margin: '8px', paddingLeft: '2%', width: '50%' }}>
                      <div class="col-">
                        <div class="input-group mb-3">
                          <input type="number" class="form-control" placeholder="Grade (%)" aria-label="grade" aria-describedby="basic-addon2" onChange={this.onChangeGrade} />
                          <div class="input-group-append">
                            <span  class="input-group-text" id="basic-addon2">%</span>
                          </div>
                        </div>
                      </div>
                      <div class="col-">
                        <button class="btn btn-outline-dark" onClick={this.Submit}>Submit Grade</button>
                      </div>
                    </div>
                    <div hidden={!this.state.is_graded} class="row" style={{ margin: '8px', paddingLeft: '2%', width: '50%' , alignItems:'center'}}>
                      <div class="col-" style={{textAlign:'center', paddingRight: '5%', alignItems:'center'}}>
                        <h4>Grade: <b>{this.state.grade}%</b></h4>
                      </div>
                      
                      <div class="col-">
                        <button class="btn btn-outline-dark" onClick={this.resetMark}>Grade Again</button>
                      </div>
                    </div>
                    <div style={{ overflowX:'scroll' }}>
                    {Object.keys(this.state.canvas).map((list, i) => (
                        <Algorithm key={i} list={list} state={this.state.canvas} isAdmin={true} style={{ float: 'left' }} />
                    ))}
                    </div>
                  </Content>
                  <Content>
                    <Results resultChartData={this.state.results} title={"Measurement Probability Graph"} width={400} height={110} />
                  </Content>
                </div>

              </div>
            </DragDropContext>
          </body>
        </div>
      );
    }
    else {
      return(
        <div>
          
        </div>
      );
    }
  }
}
