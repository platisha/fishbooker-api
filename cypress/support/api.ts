import { parseBinaryResponse } from "../helpers/parseBinary";

/**
 * Shared API utilities for crew_member_photos tests.
 * All headers, auth and common request logic lives here.
 */
const BASE_URL = 'https://qahiring.dev.fishingbooker.com/api/v1_3';
const ENDPOINT = '/crew_member_photos';

// ─── Header builders ──────────────────────────────────────────────────────────

export function getBaseHeaders(includeToken = true): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Device-Id': Cypress.env('xDeviceId'),
    'X-Application': Cypress.env('xApplication'),
    'X-Device': Cypress.env('xDevice'),
    'User-Agent': Cypress.env('userAgent'),
  };
  if (includeToken) {
    headers['Token'] = Cypress.env('token');
  }
  return headers;
}

export function getBasicAuth() {
  return {
    user: Cypress.env('basicAuthUser'),
    pass: Cypress.env('basicAuthPass'),
  };
}

// ─── Request helpers ──────────────────────────────────────────────────────────

/**
 * GET /crew_member_photos?crew_member_id=:id
 * Not protected — no token needed.
 */
export function getPhotos(crewMemberId: string | number, options: Partial<Cypress.RequestOptions> = {}) {
  return cy.request({
    method: 'GET',
    url: `${BASE_URL}${ENDPOINT}`,
    qs: { crew_member_id: crewMemberId },
    auth: getBasicAuth(),
    headers: getBaseHeaders(false),
    failOnStatusCode: false,
    ...options,
  });
}
// TESTING ONLY
export function getCrewPhotos(options: Partial<Cypress.RequestOptions> = {}) {
  // const valuesArray = Object.values(jsObject);
  // GET 200 za listu crew_member_id-> /api/v1_3/crew_member_photos?crew_member_id=3330%2C3329
  return cy.request({
    method: 'GET',
    url: `${BASE_URL}${ENDPOINT}`,
    qs: { crew_member_id: [3330, 3329] },
    auth: getBasicAuth(),
    headers: getBaseHeaders(false),
    failOnStatusCode: false,
    ...options,
  });
}

/**
 * POST /crew_member_photos
 * Protected — requires token. Captain must own the crew member.
 */
export function postPhoto(
  crewMemberId: number,
  photoFixture: string,
  options: Partial<Cypress.RequestOptions> = {},
  includeToken = true
) {
  return cy.fixture(photoFixture, 'binary').then((fileContent) => {
    const blob = Cypress.Blob.binaryStringToBlob(fileContent, 'image/jpeg');
    const formData = new FormData();
    formData.append('crew_member_id', String(crewMemberId));
    formData.append('photo', blob, photoFixture);

    return cy.request({
      method: 'POST',
      url: `${BASE_URL}${ENDPOINT}`,
      auth: getBasicAuth(),
      headers: getBaseHeaders(includeToken),
      body: formData,
      failOnStatusCode: false,
      ...options,
    })
    .then(parseBinaryResponse);
  });
}

/**
 * PATCH /crew_member_photos/:photoId
 * Infrastructure quirk: must be sent as POST with _method=patch in body.
 */
export function patchPhoto(
  photoId: number,
  photoFixture: string,
  options: Partial<Cypress.RequestOptions> = {},
  includeToken = true
) {
  return cy.fixture(photoFixture, 'binary').then((fileContent) => {
    const blob = Cypress.Blob.binaryStringToBlob(fileContent, 'image/jpeg');
    const formData = new FormData();
    formData.append('_method', 'patch');
    formData.append('photo', blob, photoFixture);

    return cy.request({
      method: 'POST',
      url: `${BASE_URL}${ENDPOINT}/${photoId}`,
      auth: getBasicAuth(),
      headers: getBaseHeaders(includeToken),
      body: formData,
      failOnStatusCode: false,
      ...options,
    }).then(parseBinaryResponse);
  });
}

/**
 * DELETE /crew_member_photos/:photoId
 * Protected — requires token. Captain must own the crew member.
 */
export function deletePhoto(
  photoId: number,
  options: Partial<Cypress.RequestOptions> = {},
  includeToken = true
) {
  return cy.request({
    method: 'DELETE',
    url: `${BASE_URL}${ENDPOINT}/${photoId}`,
    auth: getBasicAuth(),
    headers: getBaseHeaders(includeToken),
    failOnStatusCode: false,
    ...options,
  });
}

// ─── Crew member IDs ──────────────────────────────────────────────────────────

export const CREW = {
  withPhotos: {
    first: 3329,
    second: 3330,
  },
  withoutPhotos: {
    first: 3331,
    second: 3332,
  },
  invalid: 999999,
};
