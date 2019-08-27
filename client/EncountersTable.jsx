import React from 'react';
import PropTypes from 'prop-types';

import { CardText, Checkbox } from 'material-ui';
import { Table } from 'react-bootstrap';

// import ReactMixin from 'react-mixin';
// import { ReactMeteorData } from 'meteor/react-meteor-data';
// import { Session } from 'meteor/session';
// import { GlassCard, VerticalCanvas, Glass, DynamicSpacer } from 'meteor/clinical:glass-ui';

import moment from 'moment-es6'
import _ from 'lodash';
let get = _.get;
let set = _.set;

import { FaTags, FaCode, FaPuzzlePiece, FaLock  } from 'react-icons/fa';
import { GoTrashcan } from 'react-icons/go';


let styles = {
  hideOnPhone: {
    visibility: 'visible',
    display: 'table'
  },
  cellHideOnPhone: {
    visibility: 'visible',
    display: 'table',
    paddingTop: '16px',
    maxWidth: '120px'
  },
  cell: {
    paddingTop: '16px'
  }
}


flattenEncounter = function(encounter){
  let result = {
    _id: '',
    meta: '',
    subject: '',
    subjectId: '',
    status: '',
    statusHistory: 0,
    periodStart: '',
    periodEnd: '',
    reasonCode: '', 
    reasonDisplay: '', 
    typeCode: '',
    typeDisplay: '',
    classCode: ''
  };

  result._id =  get(encounter, 'id') ? get(encounter, 'id') : get(encounter, '_id');


  if(get(encounter, 'subject.display', '')){
    result.subject = get(encounter, 'subject.display', '');
  } else {
    result.subject = get(encounter, 'subject.reference', '');
  }
  result.subjectId = get(encounter, 'subject.reference', '');

  result.status = get(encounter, 'status', '');
  result.periodStart = moment(get(encounter, 'period.start', '')).format("YYYY-MM-DD hh:mm");
  result.periodEnd = moment(get(encounter, 'period.end', '')).format("YYYY-MM-DD hh:ss");
  result.reasonCode = get(encounter, 'reason[0].coding[0].code', '');
  result.reasonDisplay = get(encounter, 'reason[0].coding[0].display', '');
  result.typeCode = get(encounter, 'type[0].coding[0].code', '');
  result.typeDisplay = get(encounter, 'type[0].coding[0].display', '');
  result.classCocde = get(encounter, 'class.code', '');

  let statusHistory = get(encounter, 'statusHistory', []);

  result.statusHistory = statusHistory.length;

  return result;
}




export class EncountersTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: [],
      encounters: []
    }
  }
  getMeteorData() {

    // this should all be handled by props
    // or a mixin!
    let data = {
      style: {
        text: Glass.darkroom()
      },
      selected: [],
      encounters: []
    };


    if(this.props.data){
      console.log('this.props.data', this.props.data);

      if(this.props.data.length > 0){              
        this.props.data.forEach(function(encounter){
          data.encounters.push(flattenEncounter(encounter));
        });  
      }
    } else {
      let query = {};
      if(this.props.query){
        query = this.props.query
      }
      if(this.props.hideEnteredInError){
        query['verificationStatus'] = {
          $nin: ['entered-in-error']  // unconfirmed | provisional | differential | confirmed | refuted | entered-in-error
        }
      }

      data.encounters = Encounters.find(query).map(function(encounter){
        return flattenEncounter(encounter);
      });
    }


    if(process.env.NODE_ENV === "test") console.log("EncountersTable[data]", data);
    return data;
  }
  handleChange(row, key, value) {
    const source = this.state.source;
    source[row][key] = value;
    this.setState({source});
  }
  displayOnMobile(width){
    let style = {};
    if(['iPhone'].includes(window.navigator.platform)){
      style.display = "none";
    }
    if(width){
      style.width = width;
    }
    return style;
  }
  handleSelect(selected) {
    this.setState({selected});
  }
  getDate(){
    return "YYYY/MM/DD";
  }
  noChange(){
    return "";
  }
  rowClick(id){
    Session.set("selectedEncounterId", id);
    Session.set('encounterPageTabIndex', 2);
    Session.set('encounterDetailState', false);
  }
  renderActionIconsHeader(){
    if (!this.props.hideActionIcons) {
      return (
        <th className='actionIcons' style={{width: '100px'}}>Actions</th>
      );
    }
  }
  renderActionIcons(encounter ){
    if (!this.props.hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <td className='actionIcons' style={{minWidth: '120px'}}>
          <FaTags style={iconStyle} onClick={this.onMetaClick.bind(this, encounter)} />
          <GoTrashcan style={iconStyle} onClick={this.removeRecord.bind(this, encounter._id)} />  
        </td>
      );
    }
  } 
  removeRecord(_id){
    console.log('Remove encounter ', _id)
    if(this.props.onRemoveRecord){
      this.props.onRemoveRecord(_id);
    }
  }
  onActionButtonClick(id){
    if(typeof this.props.onActionButtonClick === "function"){
      this.props.onActionButtonClick(id);
    }
  }
  cellClick(id){
    if(typeof this.props.onCellClick === "function"){
      this.props.onCellClick(id);
    }
  }

  onMetaClick(patient){
    let self = this;
    if(this.props.onMetaClick){
      this.props.onMetaClick(self, patient);
    }
  }
  renderBarcode(id){
    if (!this.props.hideIdentifier) {
      return (
        <td><span className="barcode">{id}</span></td>
      );
    }
  }
  renderBarcodeHeader(){
    if (!this.props.hideIdentifier) {
      return (
        <th>System ID</th>
      );
    }
  }
  renderSubject(id){
    if (!this.props.hideSubjects) {
      return (
        <td className='name'>{ id }</td>
      );
    }
  }
  renderSubjectHeader(){
    if (!this.props.hideSubjects) {
      return (
        <th className='name'>Subject</th>
      );
    }
  }
  renderDevice(device){
    if (!this.props.hideDevices) {
      return (
        <td className='device.display'>{device }</td>
      );
    }
  }
  renderDeviceHeader(){
    if (!this.props.hideDevices) {
      return (
        <th className='device.display'>Device</th>
      );
    }
  }

  renderStatus(valueString){
    if (!this.props.hideValue) {
      return (
        <td className='value'>{ valueString }</td>
      );
    }
  }
  renderStatusHeader(){
    if (!this.props.hideValue) {
      return (
        <th className='value'>Value</th>
      );
    }
  }

  renderCodeHeader(){
    if (!this.props.hideCode) {
      return (
        <th className='code'>Code</th>
      );
    }
  }
  renderCode(code, value){
    if (!this.props.hideCode) {
      if(this.props.multiline){
        return (<td className='code'>
          <span style={{fontWeight: 400}}>{code }</span> <br />
          { value }
        </td>)
      } else {
        return (
          <td className='category'>{ code }</td>
        );  
      }
    }
  }
  renderCategoryHeader(){
    if (this.props.multiline === false) {
      return (
        <th className='category'>Category</th>
      );
    }
  }
  renderCategory(category){
    if (this.props.multiline === false) {
      return (
        <td className='category'>{ category }</td>
      );
    }
  }

  renderStatusString(valueString){
    if (!this.props.hideValue) {
      return (
        <td className='value'>{ valueString }</td>
      );
    }
  }
  renderStatusStringHeader(){
    if (!this.props.hideValue) {
      return (
        <th className='value'>Value</th>
      );
    }
  }
  renderComparator(comparator){
    if (!this.props.hideComparator) {
      return (
        <td className='comparator'>{ comparator }</td>
      );
    }
  }
  renderComparatorHeader(){
    if (!this.props.hideComparator) {
      return (
        <th className='comparator'>Comparator</th>
        );
    }
  }
  renderToggleHeader(){
    if (!this.props.hideCheckboxes) {
      return (
        <th className="toggle" style={{width: '60px'}} >Toggle</th>
      );
    }
  }
  renderToggle(){
    if (!this.props.hideCheckboxes) {
      return (
        <td className="toggle" style={{width: '60px'}}>
            <Checkbox
              defaultChecked={true}
            />
          </td>
      );
    }
  }

  render () {
    let tableRows = [];
    let footer;

    if(this.props.appWidth){
      if (this.props.appWidth < 768) {
        styles.hideOnPhone.visibility = 'hidden';
        styles.hideOnPhone.display = 'none';
        styles.cellHideOnPhone.visibility = 'hidden';
        styles.cellHideOnPhone.display = 'none';
      } else {
        styles.hideOnPhone.visibility = 'visible';
        styles.hideOnPhone.display = 'table-cell';
        styles.cellHideOnPhone.visibility = 'visible';
        styles.cellHideOnPhone.display = 'table-cell';
      }  
    }

    let encountersToRender = [];
    if(this.props.encounters){
      if(this.props.encounters.length > 0){              
        this.props.encounters.forEach(function(encounter){
          encountersToRender.push(flattenEncounter(encounter));
        });  
      }
    }

    if(encountersToRender.length === 0){
      console.log('No encounters to render');
      // footer = <TableNoData noDataPadding={ this.props.noDataMessagePadding } />
    } else {
      for (var i = 0; i < encountersToRender.length; i++) {
        if(this.props.multiline){
          tableRows.push(
            <tr className="encounterRow" key={i} onClick={ this.rowClick.bind(this, encountersToRender[i]._id)} >
              { this.renderToggle() }
              { this.renderActionIcons(encountersToRender[i]) }
              {this.renderSubject(encountersToRender[i].subject)}
              <td className='classCode' >{encountersToRender[i].classCode }</td>
              <td className='typeCode' >{encountersToRender[i].typeCode }</td>
              <td className='typeDisplay' >{encountersToRender[i].typeDisplay }</td>
              <td className='reasonCode' >{encountersToRender[i].reasonCode }</td>
              <td className='reasonDisplay' >{encountersToRender[i].reasonDisplay }</td>
              <td className='status' >{encountersToRender[i].status }</td>
              <td className='statusHistory' >{encountersToRender[i].statusHistory }</td>
              <td className='periodStart' style={{minWidth: '140px'}}>{encountersToRender[i].periodStart }</td>
              <td className='periodEnd' style={{minWidth: '140px'}}>{encountersToRender[i].periodEnd }</td>
              {this.renderBarcode(encountersToRender[i]._id)}
            </tr>
          );    
  
        } else {
          tableRows.push(
            <tr className="encounterRow" key={i} onClick={ this.rowClick.bind(this, encountersToRender[i]._id)} >            
              { this.renderToggle() }
              { this.renderActionIcons(encountersToRender[i]) }
              {this.renderSubject(encountersToRender[i].subject)}
              <td className='classCode' >{encountersToRender[i].classCode }</td>
              <td className='typeCode' >{encountersToRender[i].typeCode }</td>
              <td className='typeDisplay' >{encountersToRender[i].typeDisplay }</td>
              <td className='reasonCode' >{encountersToRender[i].reasonCode }</td>
              <td className='reasonDisplay' >{encountersToRender[i].reasonDisplay }</td>
              <td className='status' >{encountersToRender[i].status }</td>
              <td className='statusHistory' >{encountersToRender[i].statusHistory }</td>
              <td className='periodStart' style={{minWidth: '140px'}}>{encountersToRender[i].periodStart }</td>
              <td className='periodEnd' style={{minWidth: '140px'}}>{encountersToRender[i].periodEnd }</td>
              {this.renderBarcode(encountersToRender[i]._id)}
            </tr>
          );    
        }
      }
    }


    return(
        <Table id="encountersTable" hover >
          <thead>
            <tr>
              { this.renderToggleHeader() }
              { this.renderActionIconsHeader() }
              {this.renderSubjectHeader() }
              <th className='classCode'>Class</th>
              <th className='typeCode'>Type Code</th>
              <th className='typeDisplay'>Type</th>
              <th className='reasonCode'>Reason Code</th>
              <th className='reasonDisplay'>Reason</th>
              <th className='status'>Status</th>
              <th className='statusHistory'>History</th>
              <th className='start' style={{minWidth: '140px'}}>Start</th>
              <th className='end' style={{minWidth: '140px'}}>End</th>
              {this.renderBarcodeHeader() }
            </tr>
          </thead>
          <tbody>
            { tableRows }
          </tbody>
        </Table>
    );
  }
}

EncountersTable.propTypes = {
  barcodes: PropTypes.bool,
  encounters: PropTypes.array,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  hideCode: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideSubjects: PropTypes.bool,
  hideDevices: PropTypes.bool,
  hideComparator: PropTypes.bool,
  hideValue: PropTypes.bool,
  hideCheckboxes: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  enteredInError: PropTypes.bool,
  multiline: PropTypes.bool,
  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  actionButtonLabel: PropTypes.string
};


export default EncountersTable; 