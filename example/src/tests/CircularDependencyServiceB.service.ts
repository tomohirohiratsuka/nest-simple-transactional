import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {Transactional} from "nest-simple-transactional";
import { CircularDependencyServiceA } from './CircularDependencyServiceA.service';

@Injectable()
export class CircularDependencyServiceB extends Transactional<CircularDependencyServiceB> {
	constructor(
		moduleRef: ModuleRef,
		@Inject(forwardRef(() => CircularDependencyServiceA))
		private serviceA: CircularDependencyServiceA,
	) {
		super(moduleRef);
	}

	call() {
		return this.constructor.name;
	}

	getServiceAName() {
		return this.serviceA.call();
	}
}
