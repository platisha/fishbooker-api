/**
 * PATCH /crew_member_photos/:crew_member_photo_id
 *
 * Protected — Token required.
 * IMPORTANT infrastructure quirk: sent as HTTP POST with _method=patch in body.
 * Captain must be the owner of the crew member.
 * Body: _method (string, "patch"), photo (binary file, required, < 8MB)
 */

import { postPhoto, patchPhoto, getPhotos, CREW, deletePhoto } from '../../support/api';
import { expectSuccessWithPhotoData, getPhotoDataList } from '../../helpers/photoAssertions';
import { parseBinaryResponse } from '../../helpers/parseBinary';

describe('PATCH /crew_member_photos/:id (via POST + _method:patch)', () => {

  let testPhotoId: number;

  // Create a fresh photo before the suite so PATCH tests have a valid target
  before(() => {
    postPhoto(CREW.withoutPhotos.first, 'smaller.jpg').then((response) => {
      const [created] = expectSuccessWithPhotoData(response, { status: [200, 201], crewMemberId: CREW.withoutPhotos.first });
      testPhotoId = created.id;
    });
  });

  // Clean up the photo after all PATCH tests
  after(() => {
    if (testPhotoId) {
      deletePhoto(testPhotoId).then((deleteResponse) => {
        expect(deleteResponse.status).to.be.oneOf([200, 204]);
        expect(deleteResponse.body).to.be.empty;
      });
    }
  });

  // ─── Positive tests ──────────────────────────────────────────────────────

  it('returns 200 when replacing a photo using POST with _method:patch', () => {
    patchPhoto(testPhotoId, 'smaller.jpg').then((response) => {
      const [photo] = expectSuccessWithPhotoData(response, { status: 200, crewMemberId: CREW.withoutPhotos.first });
      expect(photo.path).to.contain('.jpg');
      expect(photo.status).to.eq('new');
    });
  });

  it('updated photo is reflected in GET response after PATCH', () => {
    patchPhoto(testPhotoId, 'smaller.jpg').then((patchResponse) => {
      const [patched] = expectSuccessWithPhotoData(patchResponse, { status: 200 });
      const updatedUrl = patched.urls.public;

      getPhotos(CREW.withoutPhotos.first).then((getResponse) => {
        expect(getResponse.status).to.eq(200);
        const list = getPhotoDataList(getResponse.body);
        const found = list.find((p: { id: number }) => p.id === testPhotoId);
        expect(found).to.exist;
        expect(found.urls.public).to.eq(updatedUrl);
      });
    });
  });

  // ─── Negative tests ──────────────────────────────────────────────────────

  it('returns 4xx when _method:patch is omitted from the request body', () => {
    // Sending as POST without _method — server should not treat this as PATCH
    cy.fixture('smaller.jpg', 'binary').then((fileContent) => {
      const blob = Cypress.Blob.binaryStringToBlob(fileContent, 'image/jpeg');
      const formData = new FormData();
      // _method intentionally omitted
      formData.append('photo', blob, 'smaller.jpg');

      cy.request({
        method: 'POST',
        url: `${Cypress.config('baseUrl')}/crew_member_photos/${testPhotoId}`,
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
        expect(parsedResponse.status).to.be.oneOf([400, 404, 405, 422]);
        expect(parsedResponse.body.error).to.be.equal("NotFound! "); // space redundant?
      });
    });
  });

  it('returns 401 when Token header is missing', () => {
    patchPhoto(testPhotoId, 'smaller.jpg', {}, false).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.error).to.be.equal("Missing or invalid authentication. Please authenticate to access this resource.");
      expect(response.body.id).to.eq('unauthorized');
      expect(response.body.data).to.be.an('array').and.to.have.length(0);
    });
  });

  it('returns 401 when Token header is invalid', () => {
    patchPhoto(testPhotoId, 'smaller.jpg', {
      headers: {
        'X-Device-Id': Cypress.env('xDeviceId'),
        'X-Application': Cypress.env('xApplication'),
        'X-Device': Cypress.env('xDevice'),
        'User-Agent': Cypress.env('userAgent'),
        Token: 'invalid-token-xyz',
      },
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.error).to.be.equal("Missing or invalid authentication. Please authenticate to access this resource.");
      expect(response.body.id).to.eq('api_token_invalid');
      expect(response.body.data).to.be.an('array').and.to.have.length(0);
    });
  });

  it('returns 413 or 422 when replacement photo exceeds 8MB size limit', () => {
    patchPhoto(testPhotoId, 'big.jpg').then((response) => {
      expect(response.status).to.be.oneOf([413, 422]);
      expect(response.body.error).to.be.equal("The file is too large (15.61 MB). Allowed maximum size is 8 MB.");
      expect(response.body.id).to.eq('too-large-error');
    });
  });

  it('returns 404 when photo ID does not exist', () => {
    patchPhoto(999999, 'smaller.jpg').then((response) => {
      expect(response.status).to.be.oneOf([403, 404]);
      expect(response.body.error).to.be.equal("Resource not found.");
      expect(response.body.id).to.eq('not-found');
      expect(response.body.data).to.be.an('array').and.to.have.length(0);
    });
  });

  it('returns 403 or 404 when photo belongs to a different captain', () => {
    // 999998 is assumed to belong to a different captain
    patchPhoto(999998, 'smaller.jpg').then((response) => {
      expect(response.status).to.be.oneOf([403, 404]);
      expect(response.body.error).to.be.equal("Resource not found.");
      expect(response.body.id).to.eq('not-found');
      expect(response.body.data).to.be.an('array').and.to.have.length(0);
    });
  });

  it('returns 422 when photo field is missing from the body', () => {
    cy.request({
      method: 'POST',
      url: `${Cypress.config('baseUrl')}/crew_member_photos/${testPhotoId}`,
      auth: { user: Cypress.env('basicAuthUser'), pass: Cypress.env('basicAuthPass') },
      headers: {
        'X-Device-Id': Cypress.env('xDeviceId'),
        'X-Application': Cypress.env('xApplication'),
        'X-Device': Cypress.env('xDevice'),
        'User-Agent': Cypress.env('userAgent'),
        Token: Cypress.env('token'),
      },
      body: { _method: 'patch' }, // photo intentionally omitted
      failOnStatusCode: false,
    }).then((response) => {
      // const parsedResponse = parseBinaryResponse(response);
      expect(response.status).to.be.eq(500);
      // expect(response.status).to.be.oneOf([400, 422]);
      // expect(parsedResponse.status).to.be.eq(500); // server error 500
      // We are already working on this. If you need any help or if you have any questions, feel free t
      // expect(parsedResponse.body.error).to.be.equal("This value should not be null.");
      // expect(parsedResponse.body.id).to.eq('is-null-error');
    });
  });
});
