
import { CardText, CardTitle } from 'material-ui/Card';
import { Tab, Tabs } from 'material-ui/Tabs';

import { GlassCard, FullPageCanvas, Glass, DynamicSpacer } from 'meteor/clinical:glass-ui';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import React  from 'react';
import { ReactMeteorData } from 'meteor/react-meteor-data';
import ReactMixin  from 'react-mixin';

import EncounterDetail from './EncounterDetail';
import EncountersTable from './EncountersTable';

import { get } from 'lodash';

Session.setDefault('encounterPageTabIndex', 1);
Session.setDefault('encounterSearchFilter', '');
Session.setDefault('selectedEncounterId', false);
Session.setDefault('fhirVersion', 'v1.0.2');

export class EncountersPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      encounterId: false,
      encounter: {}
    }
  }
  getMeteorData() {
    let data = {
      style: {
        opacity: Session.get('globalOpacity'),
        tab: {
          borderBottom: '1px solid lightgray',
          borderRight: 'none'
        }
      },
      tabIndex: Session.get('encounterPageTabIndex'),
      encounterSearchFilter: Session.get('encounterSearchFilter'),
      fhirVersion: Session.get('fhirVersion'),
      selectedEncounterId: Session.get("selectedEncounterId"),
      paginationLimit: 100,
      selectedEncounter: false,
      selected: [],
      encounters: [],
      query: {}
    };

    if(Session.get('encountersTableQuery')){
      data.query = Session.get('encountersTableQuery')
    }

    // number of items in the table should be set globally
    if (get(Meteor, 'settings.public.defaults.paginationLimit')) {
      data.paginationLimit = get(Meteor, 'settings.public.defaults.paginationLimit');
    }

    if (Session.get('selectedEncounterId')){
      data.selectedEncounter = Encounters.findOne({_id: Session.get('selectedEncounterId')});
      this.state.encounter = Encounters.findOne({_id: Session.get('selectedEncounterId')});
      this.state.encounterId = Session.get('selectedEncounterId');
    } else {
      data.selectedEncounter = false;
      this.state.encounterId = false;
      this.state.encounter = {}
    }

    data.encounters = Encounters.find(data.query).fetch();

    data.style = Glass.blur(data.style);
    data.style.appbar = Glass.darkroom(data.style.appbar);
    data.style.tab = Glass.darkroom(data.style.tab);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("EncountersPage[data]", data);
    return data;
  }

  // this could be a mixin
  handleTabChange(index){
    Session.set('encounterPageTabIndex', index);
  }
  handleActive(index){
  }
  // this could be a mixin
  onNewTab(){
    console.log("onNewTab; we should clear things...");

    Session.set('selectedEncounterId', false);
    // Session.set('encounterDetailState', {
    //   resourceType: 'Encounter',
    //   status: 'preliminary',
    //   category: {
    //     text: ''
    //   },
    //   effectiveDateTime: '',
    //   subject: {
    //     display: '',
    //     reference: ''
    //   },
    //   performer: {
    //     display: '',
    //     reference: ''
    //   },
    //   device: {
    //     display: '',
    //     reference: ''
    //   },
    //   valueQuantity: {
    //     value: '',
    //     unit: '',
    //     system: 'http://unitsofmeasure.org'
    //   }
    // });
  }
  onCancelUpsertEncounter(context){
    Session.set('encounterPageTabIndex', 1);
  }
  onDeleteEncounter(context){
    Encounters._collection.remove({_id: get(context, 'state.encounterId')}, function(error, result){
      if (error) {
        if(process.env.NODE_ENV === "test") console.log('Encounters.insert[error]', error);
        Bert.alert(error.reason, 'danger');
      }
      if (result) {
        Session.set('selectedEncounterId', false);
        HipaaLogger.logEvent({eventType: "delete", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Encounters", recordId: context.state.encounterId});
        Bert.alert('Encounter removed!', 'success');
      }
    });
    Session.set('encounterPageTabIndex', 1);
  }
  onUpsertEncounter(context){
    //if(process.env.NODE_ENV === "test") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new Encounter...', context.state)

    if(get(context, 'state.encounter')){
      let self = context;
      let fhirEncounterData = Object.assign({}, get(context, 'state.encounter'));
  
      // if(process.env.NODE_ENV === "test") console.log('fhirEncounterData', fhirEncounterData);
  
      let encounterValidator = EncounterSchema.newContext();
      // console.log('encounterValidator', encounterValidator)
      encounterValidator.validate(fhirEncounterData)
  
      if(process.env.NODE_ENV === "development"){
        console.log('IsValid: ', encounterValidator.isValid())
        console.log('ValidationErrors: ', encounterValidator.validationErrors());
  
      }
  
      console.log('Checking context.state again...', context.state)
      if (get(context, 'state.encounterId')) {
        if(process.env.NODE_ENV === "development") {
          console.log("Updating encounter...");
        }

        delete fhirEncounterData._id;
  
        // not sure why we're having to respecify this; fix for a bug elsewhere
        fhirEncounterData.resourceType = 'Encounter';
  
        Encounters._collection.update({_id: get(context, 'state.encounterId')}, {$set: fhirEncounterData }, function(error, result){
          if (error) {
            if(process.env.NODE_ENV === "test") console.log("Encounters.insert[error]", error);
            Bert.alert(error.reason, 'danger');
          }
          if (result) {
            HipaaLogger.logEvent({eventType: "update", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Encounters", recordId: context.state.encounterId});
            Session.set('selectedEncounterId', false);
            Session.set('encounterPageTabIndex', 1);
            Bert.alert('Encounter added!', 'success');
          }
        });
      } else {
        // if(process.env.NODE_ENV === "test") 
        console.log("Creating a new encounter...", fhirEncounterData);
  
        fhirEncounterData.effectiveDateTime = new Date();
        Encounters._collection.insert(fhirEncounterData, function(error, result) {
          if (error) {
            if(process.env.NODE_ENV === "test")  console.log('Encounters.insert[error]', error);
            Bert.alert(error.reason, 'danger');
          }
          if (result) {
            HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Encounters", recordId: context.state.encounterId});
            Session.set('encounterPageTabIndex', 1);
            Session.set('selectedEncounterId', false);
            Bert.alert('Encounter added!', 'success');
          }
        });
      }
    } 
    Session.set('encounterPageTabIndex', 1);
  }
  onTableRowClick(encounterId){
    Session.set('selectedEncounterId', encounterId);
    Session.set('selectedPatient', Encounters.findOne({_id: encounterId}));
  }
  onTableCellClick(id){
    Session.set('encountersUpsert', false);
    Session.set('selectedEncounterId', id);
    Session.set('encounterPageTabIndex', 2);
  }
  tableActionButtonClick(_id){
    let encounter = Encounters.findOne({_id: _id});

    // console.log("EncounterTable.onSend()", encounter);

    var httpEndpoint = "http://localhost:8080";
    if (get(Meteor, 'settings.public.interfaces.default.channel.endpoint')) {
      httpEndpoint = get(Meteor, 'settings.public.interfaces.default.channel.endpoint');
    }
    HTTP.post(httpEndpoint + '/Encounter', {
      data: encounter
    }, function(error, result){
      if (error) {
        console.log("error", error);
      }
      if (result) {
        console.log("result", result);
      }
    });
  }
  onInsert(encounterId){
    Session.set('selectedEncounterId', false);
    Session.set('encounterPageTabIndex', 1);
    HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Encounters", recordId: encounterId});
  }
  onUpdate(encounterId){
    Session.set('selectedEncounterId', false);
    Session.set('encounterPageTabIndex', 1);
    HipaaLogger.logEvent({eventType: "update", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Encounters", recordId: encounterId});
  }
  onRemove(encounterId){
    Session.set('encounterPageTabIndex', 1);
    Session.set('selectedEncounterId', false);
    HipaaLogger.logEvent({eventType: "delete", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Encounters", recordId: encounterId});
  }
  onCancel(){
    Session.set('encounterPageTabIndex', 1);
  }
  render() {
    return (
      <div id="encountersPage">
        <FullPageCanvas>
          <GlassCard height='auto'>
            <CardTitle
              title="Encounters"
            />
            <Tabs id="encountersPageTabs" default value={this.data.tabIndex} onChange={this.handleTabChange} initialSelectedIndex={1}>
              <Tab className="newEncounterTab" label='New' style={this.data.style.tab} onActive={ this.onNewTab } value={0} >
                <EncounterDetail 
                  id='newEncounter' 
                  displayDatePicker={true} 
                  displayBarcodes={false}
                  showHints={true}
                  onInsert={ this.onInsert }
                  encounter={ this.data.selectedEncounter }
                  encounterId={ this.data.selectedEncounterId } 

                  onDelete={ this.onDeleteEncounter }
                  onUpsert={ this.onUpsertEncounter }
                  onCancel={ this.onCancelUpsertEncounter } 

                  />
              </Tab>
              <Tab className="encounterListTab" label='Encounters' onActive={this.handleActive} style={this.data.style.tab} value={1}>
                <EncountersTable 
                  hideIdentifier={true} 
                  hideSubjects={false}
                  noDataMessagePadding={100}
                  encounters={ this.data.encounters }
                  paginationLimit={ this.data.pagnationLimit }
                  appWidth={ Session.get('appWidth') }
                  actionButtonLabel="Send"
                  onRowClick={ this.onTableRowClick }
                  onCellClick={ this.onTableCellClick }
                  onActionButtonClick={this.tableActionButtonClick}
                  onRemoveRecord={ this.onDeleteEncounter }
                  query={this.data.encountersTableQuery}
                  />
              </Tab>
              <Tab className="encounterDetailsTab" label='Detail' onActive={this.handleActive} style={this.data.style.tab} value={2}>
                <EncounterDetail 
                  id='encounterDetails' 
                  displayDatePicker={true} 
                  displayBarcodes={false}
                  encounter={ this.data.selectedEncounter }
                  encounterId={ this.data.selectedEncounterId } 
                  showEncounterInputs={true}
                  showHints={false}
                  onInsert={ this.onInsert }

                  onDelete={ this.onDeleteEncounter }
                  onUpsert={ this.onUpsertEncounter }
                  onCancel={ this.onCancelUpsertEncounter } 
              />
              </Tab>
            </Tabs>

          </GlassCard>
        </FullPageCanvas>
      </div>
    );
  }
}



ReactMixin(EncountersPage.prototype, ReactMeteorData);

export default EncountersPage;