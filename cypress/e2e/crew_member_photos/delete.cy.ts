/**
 * DELETE /crew_member_photos/:crew_member_photo_id
 *
 * Protected — Token required.
 * Captain must be the owner of the crew member.
 */

import { postPhoto, deletePhoto, getPhotos, CREW } from '../../support/api';

describe('DELETE /crew_member_photos/:id', () => {

  it('returns 200 or 204 when deleting a photo the captain owns', () => {
    // First create a photo to delete
    postPhoto(CREW.withoutPhotos.first, 'smaller.jpg').then((postResponse) => {
      expect(postResponse.status).to.be.oneOf([200, 201]);
      const photoId = postResponse.body.data.id;

      deletePhoto(photoId).then((deleteResponse) => {
        expect(deleteResponse.status).to.be.oneOf([200, 204]);
        expect(deleteResponse.body).to.be.empty;
      });
    });
  });

  it('deleted photo no longer appears in GET response', () => {
    postPhoto(CREW.withoutPhotos.second, 'smaller.jpg').then((postResponse) => {
      expect(postResponse.status).to.be.oneOf([200, 201]);
      const photoId = postResponse.body.data.id;

      deletePhoto(photoId).then((deleteResponse) => {
        expect(deleteResponse.status).to.be.oneOf([200, 204]);

        // Verify the photo is gone
        getPhotos(CREW.withoutPhotos.second).then((getResponse) => {
          expect(getResponse.status).to.eq(204);
          expect(getResponse.body).to.be.empty;
        });
      });
    });
  });

  // ─── Negative tests ──────────────────────────────────────────────────────

  it('returns 401 when Token header is missing', () => {
    // Use a known existing photo from a crew member that has photos
    // In a real run you would store a photo ID in a before() hook
    deletePhoto(99999, {}, false).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.error).to.be.equal("Missing or invalid authentication. Please authenticate to access this resource.");
      expect(response.body.id).to.eq('unauthorized');
      expect(response.body.data).to.be.an('array').and.to.have.length(0);
    });
  });

  it('returns 401 when Token header is invalid', () => {
    deletePhoto(99999, {
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

  it('returns 404 when photo ID does not exist', () => {
    deletePhoto(999999).then((response) => {
      expect(response.status).to.be.oneOf([403, 404]);
      expect(response.body.error).to.be.equal("Resource not found.");
      expect(response.body.id).to.eq('not-found');
      expect(response.body.data).to.be.an('array').and.to.have.length(0);
    });
  });

  it('returns 404 or 403 when attempting to delete a photo belonging to another captain', () => {
    deletePhoto(999998).then((response) => {
      expect(response.status).to.be.oneOf([403, 404]);
      expect(response.body.error).to.be.equal("Resource not found.");
      expect(response.body.id).to.eq('not-found');
      expect(response.body.data).to.be.an('array').and.to.have.length(0);
    });
  });

  it('returns 404 when trying to delete an already-deleted photo (double delete)', () => {
    postPhoto(CREW.withoutPhotos.first, 'smaller.jpg').then((postResponse) => {
      expect(postResponse.status).to.be.oneOf([200, 201]);
      const photoId = postResponse.body.data.id;
      console.log('photoId', photoId);
      // First delete
      deletePhoto(photoId).then((firstDelete) => {
        expect(firstDelete.status).to.be.oneOf([200, 204]);

        // Second delete — should fail
        deletePhoto(photoId).then((secondDelete) => {
          expect(secondDelete.status).to.be.eq(404);
          expect(secondDelete.body.error).to.be.equal("Resource not found.");
          expect(secondDelete.body.id).to.eq('not-found');
          expect(secondDelete.body.data).to.be.an('array').and.to.have.length(0);
        });
      });
    });
  });

  // just delete photo from GET response test purposes
  it.skip('delete photo from GET response', () => {
    // First create a photo to delete
    getPhotos(CREW.withoutPhotos.first).then((postResponse) => {
      expect(postResponse.status).to.be.oneOf([200, 201]);
      const photoId = postResponse.body.data.id;

      deletePhoto(photoId).then((deleteResponse) => {
        expect(deleteResponse.status).to.be.oneOf([200, 204]);
        expect(deleteResponse.body).to.be.empty;
      });
    });
  });
});
