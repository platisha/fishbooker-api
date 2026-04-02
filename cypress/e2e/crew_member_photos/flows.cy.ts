/**
 * Cross-method integration flows
 *
 * These tests verify that the four methods work correctly together
 * in realistic end-to-end sequences.
 */

import { postPhoto, patchPhoto, deletePhoto, getPhotos, CREW } from '../../support/api';
import { expectSuccessWithPhotoData } from '../../helpers/photoAssertions';

describe('Cross-method flows — crew_member_photos', () => {

  it('full lifecycle: POST → GET verify → PATCH → GET verify → DELETE → GET verify', () => {
    // 1. Upload a new photo
    postPhoto(CREW.withoutPhotos.first, 'smaller.jpg').then((postResponse) => {
      const [created] = expectSuccessWithPhotoData(postResponse, { status: [200, 201], crewMemberId: CREW.withoutPhotos.first });
      const photoId = created.id;
      expect(photoId).to.be.a('number');

      // 2. Verify photo appears in GET
      getPhotos(CREW.withoutPhotos.first).then((getResponse) => {
        expect(getResponse.status).to.eq(200);
        expect(getResponse.body.data).to.have.property('id');
        expect(getResponse.body.data.id).to.eq(photoId);

        // 3. Replace the photo via PATCH
        patchPhoto(photoId, 'smaller.jpg').then((patchResponse) => {
          expectSuccessWithPhotoData(patchResponse, { status: 200 });

          // 4. Verify the updated URL differs or is consistent
          getPhotos(CREW.withoutPhotos.first).then((getResponse2) => {
            expect(getResponse2.status).to.eq(200);
            expect(getResponse2.body.data).to.have.property('id');
            expect(getResponse2.body.data.id).to.eq(photoId);

            // 5. Delete the photo
            deletePhoto(photoId).then((deleteResponse) => {
              expect(deleteResponse.status).to.be.oneOf([200, 204]);

              // 6. Confirm photo is gone from GET
              getPhotos(CREW.withoutPhotos.first).then((finalGet) => {
                expect(finalGet.status).to.be.oneOf([200, 204]);
                if (finalGet.status === 200) {
                  expect(finalGet.body.data).to.have.property('id');
                  expect(finalGet.body.data.id).not.to.eq(photoId);
                } else {
                  expect(finalGet.body).to.be.empty;
                }
              });
            });
          });
        });
      });
    });
  });

  it('second upload for same crew member is rejected (only one photo per crew member)', () => {
    let uploadedId: number;

    postPhoto(CREW.withoutPhotos.second, 'smaller.jpg').then((r1) => {
      const [created] = expectSuccessWithPhotoData(r1, { status: [200, 201], crewMemberId: CREW.withoutPhotos.second });
      uploadedId = created.id;

      postPhoto(CREW.withoutPhotos.second, 'smaller.jpg').then((r2) => {
        expect(r2.status).to.eq(422);
        expect(r2.body.id).to.eq('crew-member-photo-already-exists');

        getPhotos(CREW.withoutPhotos.second).then((getResponse) => {
          expect(getResponse.status).to.eq(200);
          expect(getResponse.body.data).to.have.property('id');
          expect(getResponse.body.data.id).to.eq(uploadedId);

          // Cleanup
          deletePhoto(uploadedId);
        });
      });
    });
  });

  it('GET is accessible before and after a DELETE without requiring auth', () => {
    // Upload a photo
    postPhoto(CREW.withoutPhotos.first, 'smaller.jpg').then((postResponse) => {
      expect(postResponse.status).to.be.oneOf([200, 201]);
      const photoId = postResponse.body.data.id;

      // GET without token — should work (not protected)
      cy.request({
        method: 'GET',
        url: `${Cypress.config('baseUrl')}/crew_member_photos`,
        qs: { crew_member_id: CREW.withoutPhotos.first },
        auth: { user: Cypress.env('basicAuthUser'), pass: Cypress.env('basicAuthPass') },
        headers: {
          'X-Device-Id': Cypress.env('xDeviceId'),
          'X-Application': Cypress.env('xApplication'),
          'X-Device': Cypress.env('xDevice'),
          'User-Agent': Cypress.env('userAgent'),
        },
        failOnStatusCode: false,
      }).then((getResponse) => {
        expect(getResponse.status).to.eq(200);

        // Delete
        deletePhoto(photoId).then((deleteResponse) => {
          expect(deleteResponse.status).to.be.oneOf([200, 204]);

          // GET again after delete — still no token needed
          cy.request({
            method: 'GET',
            url: `${Cypress.config('baseUrl')}/crew_member_photos`,
            qs: { crew_member_id: CREW.withoutPhotos.first },
            auth: { user: Cypress.env('basicAuthUser'), pass: Cypress.env('basicAuthPass') },
            headers: {
              'X-Device-Id': Cypress.env('xDeviceId'),
              'X-Application': Cypress.env('xApplication'),
              'X-Device': Cypress.env('xDevice'),
              'User-Agent': Cypress.env('userAgent'),
            },
            failOnStatusCode: false,
          }).then((finalGet) => {
            expect(finalGet.status).to.be.oneOf([200, 204]);
          });
        });
      });
    });
  });
});
