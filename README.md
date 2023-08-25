# nest-simple-transactional
Simple transaction manager for nestjs/typeorm project. Inspired by [nest_transact](https://github.com/alphamikle/nest_transact)

## Installation

```bash
npm install nest-simple-transactional
```

## Usage
```typescript
import { Transactional } from 'nest-simple-transactional';

@Injectable()
export class SomeService extends Transactional<SomeService> {
  constructor(
      moduleRef: ModuleRef,
      @InjectRepository(SomeEntity)
      private readonly someRepository: Repository<SomeEntity>,
  ) {
      super(moduleRef)
  }

  @Transactional()
  async someMethod() {
    await this.someRepository.save(new SomeEntity());
  }
}
```

```typescript
import {DataSource} from "typeorm"; 
@Controller('items')
export class SomeController {
  constructor(
      private readonly someService: SomeService,
      dataSource: DataSource
  ) {}

  @Post()
  async create() {
      this.dataSource.transaction(async (manager) => {
          await this.someService.withTransaction(manager).someMethod();
      })
  }
}
```

## Basic Concepts
As it's said, this is inspired by `nest_transact`, this package provides simple utility wrapper class.
When you extend `Transactional` class, you can use `withTransaction` method to replace all dependent EntityManagers which is used by Repositories injected in the class to the one.
In short when you call withTransaction, it rebuilds the dependencies with the wanted EntityManger(So, it is a little costly operation, but it's not a big deal in most cases).

## Bugs
If you find some bugs or missing features, please create an issue or PR.

## License
MIT
