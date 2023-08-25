import {Inject, Injectable, Optional, Provider} from "@nestjs/common";
import {Transactional} from "nest-simple-transactional";
import {ModuleRef} from "@nestjs/core";
import {Test, TestingModule} from "@nestjs/testing";
import {InjectRepository, TypeOrmModule, TypeOrmModuleOptions} from "@nestjs/typeorm";
import {DataSource, Repository, getMetadataArgsStorage} from "typeorm";
import {EntityClassOrSchema} from "@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type";
import {CircularDependencyServiceA} from "@src/tests/CircularDependencyServiceA.service";
import {CircularDependencyServiceB} from "@src/tests/CircularDependencyServiceB.service";
import { User } from "@src/entities/user.entity";
import {Company} from "@src/entities/company.entity";


const defaultDatabaseConfig: TypeOrmModuleOptions = {
    database: `testdb`,
    entities: getMetadataArgsStorage().tables.map((tbl) => tbl.target),
    host: 'db',
    password: 'admin',
    port: 5432,
    synchronize: true,
    type: 'postgres',
    username: 'admin',
}
const getTestingModule = (providers: Provider[] = [], entities: EntityClassOrSchema[] = []): Promise<TestingModule> => {
    return Test.createTestingModule({
        imports: [
            TypeOrmModule.forRoot(defaultDatabaseConfig),
            TypeOrmModule.forFeature(entities)
        ],
        providers
    }).compile()
}
describe('Transactional, check constructor rebuilds', () => {
    @Injectable()
    class Hoge {
        call() {
            return this.constructor.name;
        }
    }
    let module: TestingModule
    afterEach(async () => {
      await module.close()
    })
    it('Should be able to call methods of property injectioned service through withTransaction', async () => {
        @Injectable()
        class Sample extends Transactional<Sample> {
            constructor(moduleRef: ModuleRef, private readonly hoge: Hoge) {
                super(moduleRef);
            }

            getHogeName() {
                return this.hoge.call();
            }
        }
        module = await getTestingModule([Sample, Hoge])
        const sampleService = module.get(Sample)
        const testDatasource = module.get(DataSource)
        await testDatasource.transaction(async (manager) => {
            expect(sampleService.withTransaction(manager).getHogeName()).toBe(Hoge.name)
        })
    })
    it('should be able to call methods of cutom token injectioned service through withTransaction', async () => {
        @Injectable()
        class Sample extends Transactional<Sample> {
            constructor(
                moduleRef: ModuleRef,
                @Inject('Hoge') private readonly hoge: Hoge,
            ) {
                super(moduleRef);
            }

            getHogeName() {
                return this.hoge.call();
            }
        }

        module = await getTestingModule([
            Sample,
            {
                provide: 'Hoge',
                useClass: Hoge,
            },
        ])
        const dataSource = module.get(DataSource);
        const sample = module.get(Sample);
        await dataSource.transaction(async (manager) => {
            const name = sample.withTransaction(manager).getHogeName();
            expect(name).toBe(Hoge.name);
        });
    })
    it('should be able to call methods of service which is injected by forwardRef through withTransaction', async () => {
      module = await getTestingModule([CircularDependencyServiceA, CircularDependencyServiceB])
        const dataSource = module.get(DataSource);
      const serviceA = module.get(CircularDependencyServiceA);
        await dataSource.transaction(async (manager) => {
          const serviceBName = serviceA.withTransaction(manager).getServiceBName()
            expect(serviceBName).toBe(CircularDependencyServiceB.name)
        })
    })
    describe('Optional injection', () => {
        it('Should instantiate service when it is provided', async () => {
            @Injectable()
            class Sample extends Transactional<Sample> {
                constructor(
                    moduleRef: ModuleRef,
                    @Optional() private readonly hoge?: Hoge,
                ) {
                    super(moduleRef);
                }
                getHogeName() {
                    return this.hoge?.call();
                }
            }
            module = await getTestingModule([Sample, Hoge])
            const dataSource = module.get(DataSource);
            const sample = module.get(Sample);
            await dataSource.transaction(async (manager) => {
                const name = sample.withTransaction(manager).getHogeName();
                expect(name).toBe(Hoge.name);
            })
        })
        it('Should return undefined when it is not provided',async () => {
            @Injectable()
            class Sample extends Transactional<Sample> {
                constructor(
                    moduleRef: ModuleRef,
                    @Optional() private readonly hoge?: Hoge,
                ) {
                    super(moduleRef);
                }
                getHogeName() {
                    return this.hoge?.call();
                }
            }
            module = await getTestingModule([Sample])
            const dataSource = module.get(DataSource);
            const sample = module.get(Sample);
            await dataSource.transaction(async (manager) => {
                const name = sample.withTransaction(manager).getHogeName();
                expect(name).toBeUndefined();
            })
        })
    })
    it('Should be able to call methods of object injectioned through withTransaction', async () => {
      interface MyObjectType {
          getName(): string
      }
      const myObject: MyObjectType = {
            getName() {
                return 'myObject'
            }
      }
        @Injectable()
        class Sample extends Transactional<Sample> {
            constructor(
                moduleRef: ModuleRef,
                @Inject('MyObject') private readonly myObject: MyObjectType,
            ) {
                super(moduleRef);
            }
            getMyObjectName() {
                return this.myObject.getName();
            }
        }
        module = await getTestingModule([
            Sample,
            {
                provide: 'MyObject',
                useValue: myObject,
            }
        ])
        const dataSource = module.get(DataSource);
        const sample = module.get(Sample);
        await dataSource.transaction(async (manager) => {
          const name = sample.withTransaction(manager).getMyObjectName()
            expect(name).toBe(myObject.getName())
        })
    })
    it('should be able to call methods of factory(non class) injectioned through withTransaction', async () => {
        @Injectable()
        class Sample extends Transactional<Sample> {
            constructor(
                moduleRef: ModuleRef,
                @Inject('MyString') private readonly myString: string,
            ) {
                super(moduleRef);
            }
            getMyString() {
                return this.myString;
            }
        }
        module = await getTestingModule([
            Sample,
            {
                provide: 'MyString',
                useFactory: () => 'myString',
            }
        ])
        const dataSource = module.get(DataSource);
        const sample = module.get(Sample);
        await dataSource.transaction(async (manager) => {
            const name = sample.withTransaction(manager).getMyString()
                expect(name).toBe('myString')
        })
    })
})

const clearDB = async (module: TestingModule) => {
    const dataSource = module.get(DataSource)
    const entities = dataSource.entityMetadatas
    for (const entity of entities) {
        const repository = dataSource.getRepository(entity.name)
        await repository.clear()
    }
}
describe('Transactional, check rollbacks', () => {
    @Injectable()
    class Sample extends Transactional<Sample> {
        constructor(
            moduleRef: ModuleRef,
            @InjectRepository(User) private readonly userRepository: Repository<User>,
            @InjectRepository(Company) private readonly companyRepository: Repository<Company>,
        ) {
            super(moduleRef);
        }
        createUser(name: string) {
            return this.userRepository.save({name})
        }
        createCompany(name: string) {
            return this.companyRepository.save({name})
        }
    }
    let module: TestingModule
    let dataSource: DataSource
    let sampleService: Sample
    beforeAll(async () => {
        module = await getTestingModule([Sample], [User, Company])
        dataSource = module.get(DataSource);
        sampleService = module.get(Sample);
    })
    beforeEach(async () => {
        await clearDB(module)
    })
    afterAll(async () => {
      await module.close()
    })
    it('should commit when no error is thrown', async () => {
        const userName = 'René Lalique'
        const companyName = 'Dragonfly lady'
        await dataSource.transaction(async (manager) => {
            await sampleService.withTransaction(manager).createUser(userName)
            await sampleService.withTransaction(manager).createCompany(companyName)
        })
        const userRepo = dataSource.getRepository(User)
        const userExists = await userRepo.exist({where: {name: userName}})
        expect(userExists).toBeTruthy()
        const companyRepo = dataSource.getRepository(Company)
        const companyExists = await companyRepo.exist({where: {name: companyName}})
        expect(companyExists).toBeTruthy()
    })
    it('Should rollback when error is thrown', async () => {
        const userName = 'René François Ghislain Magritte'
        const companyName = 'The empire of light'
        try {
            await dataSource.transaction(async (manager) => {
                await sampleService.withTransaction(manager).createUser(userName)
                await sampleService.withTransaction(manager).createCompany(companyName)
                throw new Error('rollback')
            })
        } catch (e: any) {
            if (e.message !== 'rollback') throw e
        }
        const userRepo = dataSource.getRepository(User)
        const userExists = await userRepo.exist({where: {name: userName}})
        expect(userExists).toBeFalsy()
        const companyRepo = dataSource.getRepository(Company)
        const companyExists = await companyRepo.exist({where: {name: companyName}})
        expect(companyExists).toBeFalsy()
    })
})