module.exports = {
  roots: ['test'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(test|spec).tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coverageDirectory: process.env.COVERAGE_DIRECTORY || null,
  testEnvironment: 'node'
}
