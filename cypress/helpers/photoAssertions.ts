type Maybe<T> = T | null | undefined;

export type PhotoUrls = {
  public: string;
  square: string;
};

export type PhotoData = {
  id: number;
  crew_member_id: number;
  path: string;
  width: number;
  height: number;
  aspect_ratio: number;
  status: string;
  date_created: string;
  date_updated: Maybe<string>;
  urls: PhotoUrls;
};

export function expectPhotoData(photo: any, opts: { crewMemberId?: number } = {}) {
  expect(photo, 'photo data').to.exist;
  expect(photo).to.have.property('id');
  if (opts.crewMemberId !== undefined) {
    expect(photo.crew_member_id).to.eq(opts.crewMemberId);
  } else {
    expect(photo).to.have.property('crew_member_id');
  }

  expect(photo).to.have.property('path').and.to.be.a('string');
  expect(photo).to.have.property('status').and.to.be.a('string');
  expect(photo).to.have.property('date_created');
  expect(photo).to.have.property('date_updated');
  expect(photo).to.have.property('aspect_ratio').and.to.be.a('number');
  expect(photo).to.have.property('height').and.to.be.a('number');
  expect(photo).to.have.property('width').and.to.be.a('number');

  expect(photo).to.have.property('urls');
  expect(photo.urls).to.have.property('public').and.to.be.a('string');
  expect(photo.urls).to.have.property('square').and.to.be.a('string');
  expect(photo.urls.public).to.contain('https://img-cdn.dev.fishingbooker.com/crew_member/');
}

export function getPhotoDataList(body: any): any[] {
  const data = body?.data;
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

export function expectSuccessWithPhotoData(
  response: Cypress.Response<any> | any,
  opts: { status?: number | number[]; crewMemberId?: number } = {}
) {
  const statuses = opts.status === undefined ? [200, 201] : Array.isArray(opts.status) ? opts.status : [opts.status];
  expect(response.status).to.be.oneOf(statuses);
  expect(response.body).to.have.property('data');

  const list = getPhotoDataList(response.body);
  expect(list.length, 'photo data list length').to.be.greaterThan(0);
  list.forEach((p) => expectPhotoData(p, { crewMemberId: opts.crewMemberId }));

  return list;
}

