

import EncountersPage from './client/EncountersPage';
import EncountersTable from './client/EncountersTable';
import EncounterDetail from './client/EncounterDetail';
import { Encounter, Encounters, EncounterSchema } from './lib/Encounters';

var DynamicRoutes = [{
  'name': 'EncountersPage',
  'path': '/encounters',
  'component': EncountersPage,
  'requireAuth': true
}];

var SidebarElements = [{
  'primaryText': 'EncountersPage',
  'to': '/encounters',
  'href': '/encounters'
}];

export { 
  SidebarElements, 
  DynamicRoutes, 

  EncountersPage,
  EncountersTable,
  EncounterDetail
};


