/**
 * GET /crew_member_photos
 *
 * Not protected — no token required.
 * Required query param: crew_member_id (string)
 */

import { getPhotos, CREW, getCrewPhotos } from '../../support/api';
import { expectSuccessWithPhotoData } from '../../helpers/photoAssertions';

describe('GET /crew_member_photos', () => {

  // ─── Positive tests ──────────────────────────────────────────────────────

  it('returns 200 and a list of photos for a crew member that has photos', () => {

      // "status": 200,
      //   "duration": 829,
      //   "body": {
      //     "data": {
      //       "id": 2680,
      //           "crew_member_id": 3329,
      //           "path": "a5873a883ddac82d283d4b5d77ae0f91.png",
      //           "width": 1920,
      //           "height": 1393,
      //           "aspect_ratio": 1.378,
      //           "status": "new",
      //           "date_created": "2026-03-23 18:50:11",
      //           "date_updated": null,
      //           "urls": {
      //           "public": "https://img-cdn.dev.fishingbooker.com/crew_member/3329/m/a5873a883ddac82d283d4b5d77ae0f91.png",
      //           "square": "https://img-cdn.dev.fishingbooker.com/crew_member/3329/sq/a5873a883ddac82d283d4b5d77ae0f91.png"

      getPhotos(CREW.withPhotos.first).then((response) => {
      const [photo] = expectSuccessWithPhotoData(response, { status: 200, crewMemberId: CREW.withPhotos.first });
      expect(photo.urls.public).to.contain('https://img-cdn.dev.fishingbooker.com/crew_member/3329/m/');
    });
  });

  it('returns 200 crew member with no photos', () => {
    getPhotos(CREW.withoutPhotos.first).then((response) => {
      expect(response.status).to.eq(204); // check this - expected 200 to equal 204 if photo uploaded
      expect(response.body).to.be.empty;
    });
  });

  it('returns correct photo object structure', () => {
    getPhotos(CREW.withPhotos.first).then((response) => {
      const [photo] = expectSuccessWithPhotoData(response, { status: 200, crewMemberId: CREW.withPhotos.first });
      expect(photo.urls.public).to.contain('https://img-cdn.dev.fishingbooker.com/crew_member/3329/m/');
      expect(photo.path).to.be.a('string');
    });
  });

  it.skip('returns all crew photos if passed array of crew', () => {
    // got first member only from array
    getCrewPhotos().then((response) => {
      expect(response.status).to.eq(200);
      // response.body.forEach((photo: { crew_member_id: number }) => {
      //   expect(photo.crew_member_id).to.eq(CREW.withPhotos.first);
      // });
    });
  });

  it('works without a Token header (endpoint is not protected)', () => {
    // Explicitly passing no token — should still succeed
    getPhotos(CREW.withPhotos.first).then((response) => {
      expect(response.status).to.eq(200);
    });
  });

  it('accepts crew_member_id passed as a string', () => {
    getPhotos(String('3330')).then((response) => {
      expect(response.status).to.eq(200);
    });
  });

  // ─── Negative tests ──────────────────────────────────────────────────────

  it('returns 422 or 400 when crew_member_id is missing', () => {
    cy.request({
      method: 'GET',
      url: `${Cypress.config('baseUrl')}/crew_member_photos`,
      auth: { user: Cypress.env('basicAuthUser'), pass: Cypress.env('basicAuthPass') },
      headers: {
        'X-Device-Id': Cypress.env('xDeviceId'),
        'X-Application': Cypress.env('xApplication'),
        'X-Device': Cypress.env('xDevice'),
        'User-Agent': Cypress.env('userAgent'),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.oneOf([400, 422]);
      expect(response.body.data).to.be.empty;
      expect(response.body.data).to.be.an('array').and.to.have.length(0);
      expect(response.body.error).to.be.equal("This value should not be null.");
      expect(response.body.id).to.eq('is-null-error');

      expect(response.body.errors).to.be.an('array').with.length.greaterThan(0);
      const error = response.body.errors[0];
      expect(error).to.include({
        id: 'is-null-error',
        message: 'This value should not be null.',
      });

      expect(error.path).to.deep.equal(['crew_member_id']);
      expect(error.trace_id).to.be.a('string').and.not.be.empty;

      expect(error.path, 'Error path should point to crew_member_id field')
          .to.deep.equal(['crew_member_id']);
      expect(error.trace_id, 'Trace ID should exist for debugging')
          .to.be.a('string').and.not.be.empty;
      expect(response.headers['content-type'], 'Response should be JSON')
          .to.include('application/json');

    });
  });

  it('returns 404 or empty array for a non-existent crew_member_id', () => {
    getPhotos(CREW.invalid).then((response) => {
      expect(response.status).to.be.eq(404);
      expect(response.body.data).to.be.an('array').and.to.have.length(0);
      expect(response.body.error).to.be.equal("Crew member not found.");
    });
  });

  it('returns 400 or 422 for a non-numeric crew_member_id', () => {
    getPhotos('invalid-id').then((response) => {
      expect(response.status).to.be.eq(422);
      expect(response.body.data).to.be.an('array').and.to.have.length(0);
      expect(response.body.error).to.be.equal("Please enter an integer.");
    });
  });

  it('returns 400 or 422 for a negative crew_member_id', () => {
    getPhotos(-1).then((response) => {
      expect(response.status).to.be.eq(422); // oneOf([400, 404, 422])
      expect(response.body.data).to.be.an('array').and.to.have.length(0);
      expect(response.body.error).to.be.equal("This value should be positive.");
    });
  });
});
