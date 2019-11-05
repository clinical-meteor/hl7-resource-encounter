import { 
  CssBaseline,
  Grid, 
  Container,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Button,
  Tab, 
  Tabs,
  Typography,
  Box
} from '@material-ui/core';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import React  from 'react';
import { ReactMeteorData } from 'meteor/react-meteor-data';
import ReactMixin  from 'react-mixin';

import EncounterDetail from './EncounterDetail';
import EncountersTable from './EncountersTable';

import { get } from 'lodash';

import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

Session.setDefault('encounterPageTabIndex', 1);
Session.setDefault('encounterSearchFilter', '');
Session.setDefault('selectedEncounterId', false);
Session.setDefault('fhirVersion', 'v1.0.2');


// Global Theming 
  // This is necessary for the Material UI component render layer
  let theme = {
    primaryColor: "rgb(108, 183, 110)",
    primaryText: "rgba(255, 255, 255, 1) !important",

    secondaryColor: "rgb(108, 183, 110)",
    secondaryText: "rgba(255, 255, 255, 1) !important",

    cardColor: "rgba(255, 255, 255, 1) !important",
    cardTextColor: "rgba(0, 0, 0, 1) !important",

    errorColor: "rgb(128,20,60) !important",
    errorText: "#ffffff !important",

    appBarColor: "#f5f5f5 !important",
    appBarTextColor: "rgba(0, 0, 0, 1) !important",

    paperColor: "#f5f5f5 !important",
    paperTextColor: "rgba(0, 0, 0, 1) !important",

    backgroundCanvas: "rgba(255, 255, 255, 1) !important",
    background: "linear-gradient(45deg, rgb(108, 183, 110) 30%, rgb(150, 202, 144) 90%)",

    nivoTheme: "greens"
  }

  // if we have a globally defined theme from a settings file
  if(get(Meteor, 'settings.public.theme.palette')){
    theme = Object.assign(theme, get(Meteor, 'settings.public.theme.palette'));
  }

  const muiTheme = createMuiTheme({
    typography: {
      useNextVariants: true,
    },
    palette: {
      primary: {
        main: theme.primaryColor,
        contrastText: theme.primaryText
      },
      secondary: {
        main: theme.secondaryColor,
        contrastText: theme.errorText
      },
      appBar: {
        main: theme.appBarColor,
        contrastText: theme.appBarTextColor
      },
      cards: {
        main: theme.cardColor,
        contrastText: theme.cardTextColor
      },
      paper: {
        main: theme.paperColor,
        contrastText: theme.paperTextColor
      },
      error: {
        main: theme.errorColor,
        contrastText: theme.secondaryText
      },
      background: {
        default: theme.backgroundCanvas
      },
      contrastThreshold: 3,
      tonalOffset: 0.2
    }
  });


function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      <Box p={3}>{children}</Box>
    </Typography>
  );
}


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
      query: {},
      tabIndex: Session.get('encounterPageTabIndex')
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

    // data.style = Glass.blur(data.style);
    // data.style.appbar = Glass.darkroom(data.style.appbar);
    // data.style.tab = Glass.darkroom(data.style.tab);

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

    // console.log("EncountersTable.onSend()", encounter);

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

    function handleChange(event, newValue) {
      Session.set('encounterPageTabIndex', newValue)
    }

    return (
      <div id="encountersPage" style={{paddingLeft: '100px', paddingRight: '100px'}}>
        <MuiThemeProvider theme={muiTheme} >
          <Container>
            <Card>
              <CardHeader
                title="Encounters"
              />
              <CardContent>

                    <Tabs value={this.data.tabIndex} onChange={handleChange} aria-label="simple tabs example">
                      <Tab label="Directory" />
                      <Tab label="New" />
                    </Tabs>
                    <TabPanel value={this.data.tabIndex} index={0}>
                      <EncountersTable 
                        hideIdentifier={true} 
                        hideSubjects={false}
                        noDataMessagePadding={100}
                        actionButtonLabel="Send"
                        // encounters={ this.data.encounters }
                        // paginationLimit={ this.data.pagnationLimit }
                        // appWidth={ Session.get('appWidth') }
                        // onRowClick={ this.onTableRowClick }
                        // onCellClick={ this.onTableCellClick }
                        // onActionButtonClick={this.tableActionButtonClick}
                        // onRemoveRecord={ this.onDeleteEncounter }
                        // query={this.data.encountersTableQuery}
                        />
                    </TabPanel>
                    <TabPanel value={this.data.tabIndex} index={1}>
                      <EncounterDetail 
                        id='newEncounter' 
                        displayDatePicker={true} 
                        displayBarcodes={false}
                        showHints={true}
                        // onInsert={ this.onInsert }
                        // encounter={ this.data.selectedEncounter }
                        // encounterId={ this.data.selectedEncounterId } 
                        // onDelete={ this.onDeleteEncounter }
                        // onUpsert={ this.onUpsertEncounter }
                        // onCancel={ this.onCancelUpsertEncounter } 
                        />
                    </TabPanel>

                {/* <Tabs id="encountersPageTabs" default value={this.data.tabIndex} onChange={this.handleTabChange} initialSelectedIndex={1}>
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
                </Tabs> */}
              </CardContent>
            </Card>
          </Container>
        </MuiThemeProvider>
      </div>
    );
  }
}



ReactMixin(EncountersPage.prototype, ReactMeteorData);

export default EncountersPage;