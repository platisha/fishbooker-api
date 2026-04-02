/**
 * POST /crew_member_photos
 *
 * Protected — Token required.
 * Captain must be the owner of the crew member.
 * Body: crew_member_id (integer, required), photo (binary file, required, < 8MB)
 */

import { parseBinaryResponse } from '../../helpers/parseBinary';
import { expectSuccessWithPhotoData } from '../../helpers/photoAssertions';
import { postPhoto, getPhotos, CREW, deletePhoto } from '../../support/api';

describe('POST /crew_member_photos', () => {

  // Track uploaded photo IDs so we can clean up after tests
  let uploadedPhotoIds: number[] = [];

  after(() => {
    // Best-effort cleanup — delete all photos we created during this suite
    console.log('uploadedPhotoIds', uploadedPhotoIds);
    uploadedPhotoIds.forEach((id) => {
      deletePhoto(id).then((deleteResponse: any) => {
      expect(deleteResponse.status).to.be.oneOf([200, 204]);
      expect(deleteResponse.body).to.be.empty;
    });
  });
  });

  // ─── Positive tests ──────────────────────────────────────────────────────

  it('returns 200 or 201 when uploading a valid photo for a crew member without photos', () => {
    postPhoto(CREW.withoutPhotos.first, 'smaller.jpg').then((response) => {
      const [photo] = expectSuccessWithPhotoData(response, { status: [200, 201], crewMemberId: CREW.withoutPhotos.first });
      expect(photo.path).to.contain('.jpg');
      expect(photo.status).to.eq('new');
      uploadedPhotoIds.push(photo.id);
    });
  });

  it('returns 422 when uploading a valid photo for a crew member that already has photos', () => {
    postPhoto(CREW.withPhotos.first, 'smaller.jpg').then((response) => {
      expect(response.status).to.be.eq(422);
      expect(response.body.error).to.eq('Crew member has a photo already.');
      expect(response.body.id).to.eq('crew-member-photo-already-exists');
      expect(response.body.errors[0]).to.have.property('path').and.to.include('crew_member_id');
    });
  });

  it('newly uploaded photo appears in GET response', () => {
    postPhoto(CREW.withoutPhotos.second, 'smaller.jpg').then((postResponse) => {
      const [created] = expectSuccessWithPhotoData(postResponse, { status: [200, 201], crewMemberId: CREW.withoutPhotos.second });
      const newPhotoId = created.id;
      uploadedPhotoIds.push(newPhotoId);

      getPhotos(CREW.withoutPhotos.second).then((getResponse) => {
        const list = expectSuccessWithPhotoData(getResponse, { status: 200, crewMemberId: CREW.withoutPhotos.second });
        expect(list.map((p: { id: number }) => p.id)).to.include(newPhotoId);
      });
    });
  });

  // ─── Negative tests ──────────────────────────────────────────────────────

  it('returns 401 when Token header is missing', () => {
    postPhoto(CREW.withoutPhotos.first, 'smaller.jpg', {}, false).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.error).to.be.equal("Missing or invalid authentication. Please authenticate to access this resource.");
      expect(response.body.id).to.eq('unauthorized');
      expect(response.body.data).to.be.an('array').and.to.have.length(0);
    });
  });

  it('returns 401 when Token header is invalid', () => {
    postPhoto(CREW.withoutPhotos.first, 'smaller.jpg', {
      headers: {
        'X-Device-Id': Cypress.env('xDeviceId'),
        'X-Application': Cypress.env('xApplication'),
        'X-Device': Cypress.env('xDevice'),
        'User-Agent': Cypress.env('userAgent'),
        Token: 'invalid-token-xyz',
      },
    }).then((response) => {
      const parsedResponse = parseBinaryResponse(response);
      expect(parsedResponse.status).to.eq(401);
      expect(parsedResponse.body.error).to.be.equal("Missing or invalid authentication. Please authenticate to access this resource.");
      expect(parsedResponse.body.id).to.eq('api_token_invalid');
      expect(parsedResponse.body.data).to.be.an('array').and.to.have.length(0);
    });
  });

  it('returns 413 or 422 when photo exceeds 8MB size limit', () => {
    postPhoto(CREW.withoutPhotos.first, 'big.jpg').then((response) => {
      expect(response.status).to.be.oneOf([413, 422]);
      expect(response.body.error).to.be.equal("The file is too large (15.61 MB). Allowed maximum size is 8 MB.");
      expect(response.body.id).to.eq('too-large-error');
    });
  });

  it('returns 422 when photo field is missing from the request body', () => {
    cy.request({
      method: 'POST',
      url: `${Cypress.config('baseUrl')}/crew_member_photos`,
      auth: { user: Cypress.env('basicAuthUser'), pass: Cypress.env('basicAuthPass') },
      headers: {
        'X-Device-Id': Cypress.env('xDeviceId'),
        'X-Application': Cypress.env('xApplication'),
        'X-Device': Cypress.env('xDevice'),
        'User-Agent': Cypress.env('userAgent'),
        Token: Cypress.env('token'),
      },
      body: { crew_member_id: CREW.withoutPhotos.first },
      failOnStatusCode: false,
    }).then((response) => {
      const parsedResponse = parseBinaryResponse(response);
      expect(parsedResponse.status).to.be.oneOf([400, 422]);
      expect(parsedResponse.body.error).to.be.equal("This value should not be null.");
      expect(parsedResponse.body.id).to.eq('is-null-error');

    });
  });

  it('returns 422 when crew_member_id is missing from the request body', () => {
    cy.fixture('smaller.jpg', 'binary').then((fileContent) => {
      const blob = Cypress.Blob.binaryStringToBlob(fileContent, 'image/jpeg');
      const formData = new FormData();
      formData.append('photo', blob, 'smaller.jpg');
      // crew_member_id intentionally omitted

      cy.request({
        method: 'POST',
        url: `${Cypress.config('baseUrl')}/crew_member_photos`,
        auth: { user: Cypress.env('basicAuthUser'), pass: Cypress.env('basicAuthPass') },
        headers: {
          'X-Device-Id': Cypress.env('xDeviceId'),
          'X-Application': Cypress.env('xApplication'),
          'X-Device': Cypress.env('xDevice'),
          'User-Agent': Cypress.env('userAgent'),
          Token: Cypress.env('token'),
        },
        body: formData,
        failOnStatusCode: false,
      }).then((response) => {
        const parsedResponse = parseBinaryResponse(response);
        expect(parsedResponse.status).to.be.oneOf([400, 422]);
        expect(parsedResponse.body.error).to.be.equal("This value should not be null.");
        expect(parsedResponse.body.id).to.eq('is-null-error');
      });
    });
  });

  it('returns 403 or 404 when crew_member_id does not belong to the authenticated captain', () => {
    // different captain
    postPhoto(CREW.invalid, 'smaller.jpg').then((response) => {
      expect(response.status).to.be.oneOf([403, 404]);
      expect(response.body.error).to.be.equal("Crew member not found.");
      expect(response.body.id).to.eq('crew-member-not-found');
    });
  });

  it('returns 422 when crew_member_id is a string instead of an integer', () => {
    cy.fixture('smaller.jpg', 'binary').then((fileContent) => {
      const blob = Cypress.Blob.binaryStringToBlob(fileContent, 'image/jpeg');
      const formData = new FormData();
      formData.append('crew_member_id', 'not-an-integer');
      formData.append('photo', blob, 'smaller.jpg');

      cy.request({
        method: 'POST',
        url: `${Cypress.config('baseUrl')}/crew_member_photos`,
        auth: { user: Cypress.env('basicAuthUser'), pass: Cypress.env('basicAuthPass') },
        headers: {
          'X-Device-Id': Cypress.env('xDeviceId'),
          'X-Application': Cypress.env('xApplication'),
          'X-Device': Cypress.env('xDevice'),
          'User-Agent': Cypress.env('userAgent'),
          Token: Cypress.env('token'),
        },
        body: formData,
        failOnStatusCode: false,
      }).then((response) => {
        const parsedResponse = parseBinaryResponse(response);
        expect(parsedResponse.status).to.be.oneOf([400, 422]);
        expect(parsedResponse.body.error).to.be.equal("Please enter an integer.");
        expect(parsedResponse.body.id).to.eq('not-synchronized-error');
      });
    });
  });
});
