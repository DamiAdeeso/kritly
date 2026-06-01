import { fail, ok, okEmpty } from '../dto/common.dto';

describe('common.dto helpers', () => {
  it('builds success envelopes', () => {
    expect(ok('Success', { id: '1' }, 201)).toEqual({
      statusCode: 201,
      message: 'Success',
      data: { id: '1' },
    });
  });

  it('builds empty success envelopes', () => {
    expect(okEmpty('Done')).toEqual({
      statusCode: 200,
      message: 'Done',
      data: {},
    });
  });

  it('builds failure envelopes', () => {
    expect(fail('Invalid input', 400)).toEqual({
      statusCode: 400,
      message: 'Invalid input',
      data: null,
    });
  });
});
