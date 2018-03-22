import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

var Table = require('react-bootstrap/lib/Table');
var Button = require('react-bootstrap/lib/Button');

var Grid = require('react-bootstrap/lib/Grid');
var Col = require('react-bootstrap/lib/Col');
var Row = require('react-bootstrap/lib/Row');

var DropdownButton = require('react-bootstrap/lib/DropdownButton');
var MenuItem = require('react-bootstrap/lib/MenuItem');
var FormControl = require('react-bootstrap/lib/FormControl');

const selected = {color: 'white', backgroundColor: 'black'};
const base = {color: 'black', backgroundColor: 'white'};

// ==================================================================================================

class EntryButton extends React.Component {
  render() {
    return (
      <Button style={this.props.value === 1 ? selected : base} onClick={() => this.props.onClick()}>
        {this.props.nameID}
      </Button>
    );
  }
}

class EntryText extends React.Component {
  render() {
    return (
      <FormControl onChange={(e) => this.props.onChange(e)} defaultValue={this.props.value}/>
    );
  }
}

// ==================================================================================================

class CoeffTable extends React.Component {
  render() {
    const heads = Array(this.props.sizeY).fill().map((v,i) => <th key={"Hr" + i} className="text-center">{this.props.rows[i]}</th>);
    const rows = Array(this.props.sizeY).fill().map((v,i) =>
      <tr key={"Rr" + i}><td><b>{this.props.rows[i]}</b></td>{this.props.coeff[i].map((v,j) =>
        <td key={"Dr" + i + j}>{v.toFixed(2)}</td>)}</tr>);

    return (
      <Table condensed bordered>
        <thead>
          <tr>
            <th></th>
            {heads}
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </Table>
    );
  }
}

// ==================================================================================================

class TableView extends React.Component {
  constructor(props) {
    super(props);

    const maxX = 25, maxY = 25;

    const data = new Array(maxX);

    for(let i = 0; i < data.length; i++){  
      const mach = Array(maxY);

      for(let j = 0; j < mach.length; j++){
        mach[j] = {mach: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[j], item: (i + 1).toString(), v: 0};
      }
      data[i] = mach.slice();
    }

    const cols = Array(maxX).fill(0).map((v,i) => (i+1));
    const rows = Array(maxY).fill(0).map((v,i) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i]);

    this.state = {
      data: data,
      cols: cols,
      rows: rows,
      hasCoeff: false,
      savedState: null,
    };

    this.kingsAlgoStep = this.kingsAlgoStep.bind(this);
    this.coeffStep = this.coeffStep.bind(this);
    this.reload = this.reload.bind(this);
    this.saveState = this.saveState.bind(this);
  }

  handleClick(i,j) {
    const newState = this.state.data.slice();
    newState[i][j].v = newState[i][j].v === 0 ? 1 : 0;
    this.setState({data: newState});
  }

  handleChange(i,j,e) {
    const newState = this.state.data.slice();
    newState[i][j].v = e.target.value; 
    this.setState({data: newState});
  }

  prodsumDiff(a,b){
    return (
      b.reduceRight((accumulator, currentValue, index, arr) => accumulator + currentValue.v * Math.pow(2, arr.length - index), 0)
      -
      a.reduceRight((accumulator, currentValue, index, arr) => accumulator + currentValue.v * Math.pow(2, arr.length - index), 0)
    )
  }

  calculateCoeff(data){
    const coeff = new Array(this.props.sizeY);
    let nij, ni, nj;

    for(let mach = 0; mach < this.props.sizeY; mach++){
      ni = data[mach].reduce((acc, cv) => acc + cv.v, 0);

      coeff[mach] = new Array(this.props.sizeY);
      for(let comp = 0; comp < this.props.sizeY; comp++){
        nj = data[comp].reduce((acc, cv) => acc + cv.v, 0);

        nij = 0;

        for(let wp = 0; wp < this.props.sizeX; wp++){
          nij += data[comp][wp].v * data[mach][wp].v;
        }

        coeff[mach][comp] = nij / (ni < nj ? ni : nj);
      }
    }

    return coeff;
  }


  mergeClusters(coeff,i,j){
    const kij = [];

    for(let k = 0; k < coeff[0].length; k++){
      if(k === i || k === j) continue;
      kij.push(Math.max(coeff[k][i], coeff[k][j]))
    }

    kij.push(1);
    return kij;
  }

  coeffStep(hasCoeff){
    if(hasCoeff){
      const coeff = this.state.coeff.slice();

      let max = [0,0,0];
      for(let i = 1; i < this.state.clusters; i++){
        for(let j = 0; j < i; j++){
          max = coeff[i][j] > max[0] ? [coeff[i][j],i,j] : max;
        }
      }

      const clusterComb = this.mergeClusters(coeff,max[1],max[2]);
      let coeffRec = [];


      let ni = 0;
      let arr = [];
      for(let i = 0; i < this.state.clusters; i++){
        if(i === max[1] || i === max[2]) continue;
        arr = [];
        for(let j = 0; j < this.state.clusters; j++)
          if(j !== max[1] && j !== max[2])
            arr.push(coeff[i][j]);

        arr.push(clusterComb[ni++]);
        coeffRec.push(arr.slice());
      }

      coeffRec.push(clusterComb.slice());


      let newRows = this.state.clusterRows.slice();
      const newCluster = this.state.clusterRows[max[1]] + "" + this.state.clusterRows[max[2]];
      newRows.splice(max[1],1);
      newRows.splice(max[2],1);
      newRows.push(newCluster);

      const clusters = this.state.clusters-1;

      console.log(newRows);
      this.setState({coeff: coeffRec, clusters: clusters, clusterRows: newRows});
    } else {
    const data = this.state.data.slice();
      const coeff = this.calculateCoeff(data);
      const clusterRows = this.state.rows.slice(0,this.props.sizeY);

      this.setState({coeff: coeff, hasCoeff: true, clusters: coeff.length, clusterRows: clusterRows});
    }
    }

  kingsAlgoStep(isCol){
    const dataClone = this.state.data.slice();

    if(isCol){
      const sorted = dataClone.sort(this.prodsumDiff);

      const cols = sorted.map((a) => a[0].item);
      const rows = sorted[0].map((v) => v.mach);

      this.setState({data: sorted, cols: cols, rows: rows});
    } else {
      const transpose = dataClone.reduce((prev, next) => next.map((v, i) => (prev[i] || []).concat(next[i])), []);
      const sorted = transpose.sort(this.prodsumDiff);
      const transposeBack = sorted.reduce((prev, next) => next.map((v, i) => (prev[i] || []).concat(next[i])), []);

      const cols = transposeBack.map((a) => a[0].item);
      const rows = transposeBack[0].map((v) => v.mach);

      this.setState({data: transposeBack, cols: cols, rows: rows});
    }

  }

  /*
   * 
  {(this.props.algo === 2) &&
      <EntryText nameID={this.state.data[i][j].v} value={this.state.data[i][j].v}
        onChange={(e) => this.handleChange(i,j,e)}
        type={this.props.algo}
      />}
   *
   */

  createRow(j){
    return (
      Array(this.props.sizeX).fill().map((v,i) =>
        <td key={"D" + i.toString() + j.toString()} className="text-center">
          <EntryButton nameID={this.state.data[i][j].v} value={this.state.data[i][j].v}
            onClick={() => this.handleClick(i,j)}
            type={this.props.algo}
          />
        </td>
      )
    );
  }

  saveState(){
    const maxX = 25, maxY = 25;
    const data = new Array(maxX);

    for(let i = 0; i < data.length; i++){  
      const mach = Array(maxY);

      for(let j = 0; j < mach.length; j++){
        mach[j] = Object.assign({},this.state.data[i][j]);
      }
      data[i] = mach.slice();
    }

    this.setState({savedState: data});
  }

  reload(){
    const maxX = 25, maxY = 25;
    const data = new Array(maxX);

    for(let i = 0; i < data.length; i++){  
      const mach = Array(maxY);

      for(let j = 0; j < mach.length; j++){
        mach[j] = Object.assign({},this.state.savedState[i][j]);
      }
      data[i] = mach.slice();
    }

    this.setState({data: data});
  }

  render() {
    const heads = Array(this.props.sizeX).fill().map((v,i) => <th key={"H" + i} className="text-center">{this.state.cols[i]}</th>);
    const rows = Array(this.props.sizeY).fill().map((v,i) => <tr key={"R" + i}><td><b>{this.state.rows[i]}</b></td>{this.createRow(i)}</tr>);

    return (
      <div>
        <Grid>
          <Row className="with-margin">
            {this.props.algo === 1 &&
                <div>
                  <Col md={2}>
                    <Button onClick={() => this.kingsAlgoStep(true)}>Run Columns</Button>
                  </Col>
                  <Col md={2}>
                    <Button onClick={() => this.kingsAlgoStep(false)}>Run Rows</Button>
                  </Col>
                </div>
            }
            {this.props.algo === 2 &&
                <div>
                  <Col md={2}>
                    <Button onClick={() => this.coeffStep(false)}>Calculate Coefficients</Button>
                  </Col>

                  <Col md={2}>
                    <Button className={this.state.hasCoeff ? 'enabled' : 'disabled'}onClick={() => this.coeffStep(this.state.hasCoeff)}>Step</Button>
                  </Col>
                </div>
            }

            <Col md={2}>
              <Button onClick={() => this.saveState()}>Save State</Button>
            </Col>

            {this.state.savedState !== null &&
                <Col md={2}>
                  <Button onClick={() => this.reload()}>Reload State</Button>
                </Col>
            }
          </Row>
          <hr/>
          <Row className="with-margin">
            <Col md={7} style={{borderRight: '1px dashed #333'}}>
              <Table condensed>
                <thead>
                  <tr>
                    <th></th>
                    {heads}
                  </tr>
                </thead>
                <tbody>
                  {rows}
                </tbody>
              </Table>
            </Col>
          </Row>
          {this.state.hasCoeff &&
              <Row>
                <Col md={7} style={{borderRight: '1px dashed #333'}}>
                  <CoeffTable sizeY={this.state.clusters} rows={this.state.clusterRows} coeff={this.state.coeff}/>
                </Col>
              </Row>
          }
        </Grid>
      </div>
    );
  }
}

// ==================================================================================================

class Chalan extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      sizeX: 7,
      sizeY: 5,
      algo: 1,
    };

    this.handleInput = this.handleInput.bind(this);
  }

  handleInput(e){
    const v = parseInt(e.target.value, 10);
    const n = e.target.name;
    if(v < 26 && v > 0){
      if(n === "X")
        this.setState({sizeX: v});
      else
        this.setState({sizeY: v});
    }
  }

  render() {
    return (
      <div className="tableview">
        <h1 className="page-header">Chalán del Tec</h1>

        <Grid>
          <Row>
            <Col md={2}>
              <h2>Ajustes</h2>
            </Col>
          </Row>
          <Row className="with-margin">
            <Col md={2}>
              <DropdownButton
                bsStyle="primary"
                title="Algoritmo"
                key={0}
                id={`dropdown-basic-${0}`}
                onSelect={(k, e) => this.setState({algo: k})}
              >
                <MenuItem eventKey={1}>King's Algorithm</MenuItem>
                <MenuItem eventKey={2}>Coefficient Clustering</MenuItem>
              </DropdownButton>
            </Col>
            <Col md={2}>
              <FormControl type="number" name="Y" placeholder="Máquinas" defaultValue={this.state.sizeY} onChange={(e) => this.handleInput(e)}/>
            </Col>
            <Col md={2}>
              <FormControl type="number" name="X" placeholder="Piezas" defaultValue={this.state.sizeX} onChange={(e) => this.handleInput(e)}/>
            </Col>
          </Row>

          <Row>
            <Col>
              <div className="table">
                <TableView sizeX={this.state.sizeX} sizeY={this.state.sizeY} algo={this.state.algo}/>
              </div>
            </Col>
          </Row>
        </Grid>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Chalan />,
  document.getElementById('root')
);

