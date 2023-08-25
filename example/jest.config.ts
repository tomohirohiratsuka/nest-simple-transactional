/** @type {import("ts-jest").JestConfigWithTsJest} */
module.exports = {
	collectCoverageFrom: ['**/*.(t|j)s'],
	coverageDirectory: './coverage',
	coveragePathIgnorePatterns: [
		'/node_modules/',
		'/dist/',
		'/coverage/',
		'/infra/',
		'.eslintrc.js',
		'jest.config.ts',
		'ormconfig.ts',
	],
	coverageReporters: ['text', 'json-summary'],
	moduleFileExtensions: ['js', 'json', 'ts'],
	moduleNameMapper: {
		'@src(.*)$': '<rootDir>/src/$1',
	},
	modulePaths: ['<rootDir>/src'],
	preset: 'ts-jest',
	reporters: ['default', 'jest-junit'],
	rootDir: './',
	testEnvironment: 'node',
	testRegex: '.*\\.spec\\.ts$',
	testTimeout: 10000,
	transform: {
		'^.+\\.(t|j)s$': 'ts-jest',
	},
};
