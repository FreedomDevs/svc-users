// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  moduleNameMapper: {
    // Локальные файлы проекта, исключая @prisma/client
    '^@prisma/(?!client)(.+)$': '<rootDir>/../src/prisma/$1',
    '^@common/(.+)$': '<rootDir>/../src/common/$1',
  },
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../tsconfig.json',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!@prisma/client)'],
};