
Encounters = new Meteor.Collection('encounters');

if (Meteor.isClient){
  Meteor.subscribe('encounters');
}



EncounterSchema = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Encounter"
    }
});
Encounters.attachSchema(EncounterSchema);
