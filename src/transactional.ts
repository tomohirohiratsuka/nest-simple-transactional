import 'reflect-metadata';
import {
    OPTIONAL_DEPS_METADATA,
    PARAMTYPES_METADATA,
    SELF_DECLARED_DEPS_METADATA,
} from '@nestjs/common/constants';
import { ModuleRef } from '@nestjs/core';
import { EntityManager, Repository } from 'typeorm';

type ClassType<T = any> = new (...args: any[]) => T;

export class Transactional<T = ClassType> {
    constructor(private moduleRef: ModuleRef) {}

    /**
     * @description
     * Returns a new instance of the class with the given manager.
     * @param manager
     */
    withTransaction(manager: EntityManager): this {
        const newConstructorArgs = this.rebuildConstructorArgs(
            this.constructor as ClassType<this>,
            manager,
        );

        return new (this.constructor as ClassType<this>)(...newConstructorArgs);
    }

    /**
     * @description
     * Rebuilds the constructor arguments for the given class with the given manager.
     * @param target
     * @param manager
     * @private
     */
    private rebuildConstructorArgs(
        target: ClassType,
        manager: EntityManager,
    ): any[] {
        const paramTypes = Reflect.getMetadata(PARAMTYPES_METADATA, target) || [];
        const selfDeclaredTypes =
            Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) || [];

        return paramTypes.map((paramType: any, index: number) => {
            const selfDeclaredType = selfDeclaredTypes.find(
                (type: { index: number; param: string }) => type.index === index,
            );

            if (this.isRepository(paramType) && selfDeclaredType) {
                return manager.getRepository(
                    this.transformRepositoryName(selfDeclaredType.param),
                );
            }

            const isOptionalParam = this.isOptionalPram(target, index);

            if (selfDeclaredType) {
                //There is no metadata in the provider's definition of whether or not they use custom tokens, so those that can be resolved here are resolved here first, as a priority.
                const token = selfDeclaredType.param.forwardRef
                    ? selfDeclaredType.param.forwardRef()
                    : selfDeclaredType.param;
                return this.getParam(token, isOptionalParam);
            }
            if (typeof paramType === 'function') {
                return this.getParam(paramType, isOptionalParam);
            }
            throw new Error(`Unexpected constructor parameter type ${paramType}.`);
        });
    }

    /**
     * @description
     * Get actual param with optional handling
     * @param token
     * @param isOptionalParam
     * @private
     */
    private getParam(token: any, isOptionalParam: boolean) {
        try {
            return this.getModuleRefInstance(token);
        } catch (e: any) {
            if (isOptionalParam) {
                return undefined;
            }
            throw e;
        }
    }

    /**
     * @description
     * Check if the param is @Optional()
     * @param target
     * @param index
     * @private
     */
    private isOptionalPram(target: ClassType, index: number): boolean {
        const optionalParamTypes =
            Reflect.getMetadata(OPTIONAL_DEPS_METADATA, target) || [];
        return optionalParamTypes.includes(index);
    }

    /**
     * @param token
     * @private
     * @throws
     */
    private getModuleRefInstance(token: any): any {
        return this.moduleRef.get(token, { strict: false });
    }

    /**
     * @description
     * Returns true if the given class is a repository.
     * @param cls
     * @private
     */
    private isRepository(cls: ClassType): boolean {
        return (
            cls.prototype instanceof Repository || cls.name.endsWith('Repository')
        );
    }

    /**
     * @description
     * Transforms the repository name to the entity name.
     * @param repositoryName
     * @private
     */
    private transformRepositoryName(repositoryName: string): string {
        if (repositoryName.endsWith('Repository')) {
            return repositoryName.replace('Repository', '');
        }
        return repositoryName;
    }
}
