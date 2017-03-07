if(Package['clinical:autopublish']){
  console.log("*****************************************************************************")
  console.log("HIPAA WARNING:  Your app has the 'clinical-autopublish' package installed.");
  console.log("Any protected health information (PHI) stored in this app should be audited."); 
  console.log("Please consider writing secure publish/subscribe functions and uninstalling.");  
  console.log("");  
  console.log("meteor remove clinical:autopublish");  
  console.log("");  
}
if(Package['autopublish']){
  console.log("*****************************************************************************")
  console.log("HIPAA WARNING:  DO NOT STORE PROTECTED HEALTH INFORMATION IN THIS APP. ");  
  console.log("Your application has the 'autopublish' package installed.  Please uninstall.");
  console.log("");  
  console.log("meteor remove autopublish");  
  console.log("meteor add clinical:autopublish");  
  console.log("");  
}





// create the object using our BaseModel
Encounter = BaseModel.extend();


//Assign a collection so the object knows how to perform CRUD operations
Encounter.prototype._collection = Encounters;

// Create a persistent data store for addresses to be stored.
// HL7.Resources.Patients = new Mongo.Collection('HL7.Resources.Patients');
Encounters = new Mongo.Collection('Encounters');

//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Encounters._transform = function (document) {
  return new Encounter(document);
};



EncounterSchema = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Encounter"
  },
  "identifier" : {
    optional: true,
    type: [ IdentifierSchema ]
  }, // Identifier(s) by which this encounter is known
  "status" : {
    optional: true,
    type: Code
  }, // R!  planned | arrived | in-progress | onleave | finished | cancelled
  "statusHistory.$.status" : {
    optional: true,
    type: Code
  }, // R!  planned | arrived | in-progress | onleave | finished | cancelled
  "statusHistory.$.period" : {
    optional: true,
    type: PeriodSchema
  }, // R!  The time that the episode was in the specified status
  "class" : {
    optional: true,
    type: Code
  }, // inpatient | outpatient | ambulatory | emergency +
  "type" : {
    optional: true,
    type: [ CodeableConceptSchema ]
  }, // Specific type of encounter
  "priority" : {
    optional: true,
    type: CodeableConceptSchema
  }, // Indicates the urgency of the encounter
  "patient" : {
    optional: true,
    type: ReferenceSchema
  }, // (Patient) The patient present at the encounter
  "episodeOfCare" : {
    optional: true,
    type: [ ReferenceSchema ]
  }, // (EpisodeOfCare) Episode(s) of care that this encounter should be recorded against
  "incomingReferral" : {
    optional: true,
    type: [ ReferenceSchema ]
  }, // (ReferralRequest) The ReferralRequest that initiated this encounter
  "participant.$.type" : {
    optional: true,
    type: [ CodeableConceptSchema ]
  }, // Role of participant in encounter
  "participant.$.period" : {
    optional: true,
    type: PeriodSchema
  }, // PeriodSchema of time during the encounter participant was present
  "participant.$.individual" : {
    optional: true,
    type:  ReferenceSchema
  }, // (Practitioner|RelatedPerson) Persons involved in the encounter other than the patient
  "appointment" : {
    optional: true,
    type: ReferenceSchema
  }, // (Appointment) The appointment that scheduled this encounter
  "period" : {
    optional: true,
    type: PeriodSchema
  }, // The start and end time of the encounter
  "length" : {
    optional: true,
    type: QuantitySchema
  }, // Quantity of time the encounter lasted (less time absent)
  "reason" : {
    optional: true,
    type: [ CodeableConceptSchema ]
  }, // Reason the encounter takes place (code)
  "indication" : {
    optional: true,
    type: [ ReferenceSchema ]
  }, // (Condition|Procedure) Reason the encounter takes place (resource)
  "hospitalization.preAdmissionIdentifier" : {
    optional: true,
    type: IdentifierSchema
  }, // Pre-admission identifier
  "hospitalization.origin" : {
    optional: true,
    type: ReferenceSchema
  }, // (Location) The location from which the patient came before admission
  "hospitalization.admitSource" : {
    optional: true,
    type: CodeableConceptSchema
  }, // From where patient was admitted (physician referral, transfer)
  "hospitalization.admittingDiagnosis" : {
    optional: true,
    type: [ ReferenceSchema ]
  }, // (Condition) The admitting diagnosis as reported by admitting practitioner
  "hospitalization.reAdmission" : {
    optional: true,
    type: CodeableConceptSchema
  }, // The type of hospital re-admission that has occurred (if any). If the value is absent, then this is not identified as a readmission
  "hospitalization.dietPreference" : {
    optional: true,
    type: [ CodeableConceptSchema ]
  }, // Diet preferences reported by the patient
  "hospitalization.specialCourtesy" : {
    optional: true,
    type: [ CodeableConceptSchema ]
  }, // Special courtesies (VIP, board member)
  "hospitalization.specialArrangement" : {
    optional: true,
    type: [ CodeableConceptSchema ]
  }, // Wheelchair, translator, stretcher, etc.
  "hospitalization.destination" : {
    optional: true,
    type:  ReferenceSchema
  }, // (Location) Location to which the patient is discharged
  "hospitalization.dischargeDisposition" : {
    optional: true,
    type: CodeableConceptSchema
  }, // Category or kind of location after discharge
  "hospitalization.dischargeDiagnosis" : {
    optional: true,
    type: [ ReferenceSchema ]
  }, // (Condition) The final diagnosis given a patient before release from the hospital after all testing, surgery, and workup are complete
  "location.$.location" : {
    optional: true,
    type: ReferenceSchema
  }, // (Location) R!  Location the encounter takes place
  "location.$.status" : {
    optional: true,
    type: Code
  }, // planned | active | reserved | completed
  "location.$.period" : {
    optional: true,
    type: PeriodSchema
  }, // Time period during which the patient was present at the location
  "serviceProvider" : {
    optional: true,
    type: ReferenceSchema
  }, // (Organization) The custodian organization of this Encounter record
  "partOf" : {
    optional: true,
    type: ReferenceSchema
  } // (Encounter) Another Encounter this encounter is part of
});
Encounters.attachSchema(EncounterSchema);
