import React from 'react';

import EncountersPage from './client/EncountersPage';
import EncountersTable from './client/EncountersTable';
import EncounterDetail from './client/EncounterDetail';
import { Encounter, Encounters, EncounterSchema } from './lib/Encounters';

import { FaHospitalAlt } from 'react-icons/fa';

var DynamicRoutes = [{
  'name': 'EncountersPage',
  'path': '/encounters',
  'component': EncountersPage,
  'requireAuth': true
}];

var SidebarElements = [{
  'primaryText': 'Encounters',
  'to': '/encounters',
  'href': '/encounters',
  'icon': <FaHospitalAlt />
}];

export { 
  SidebarElements, 
  DynamicRoutes, 

  EncountersPage,
  EncountersTable,
  EncounterDetail
};


