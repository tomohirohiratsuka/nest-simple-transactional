import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CircularDependencyServiceB } from './CircularDependencyServiceB.service';
import {Transactional} from "nest-simple-transactional";

@Injectable()
export class CircularDependencyServiceA extends Transactional<CircularDependencyServiceA> {
	constructor(
		@Inject(forwardRef(() => CircularDependencyServiceB))
		private serviceB: CircularDependencyServiceB,
		moduleRef: ModuleRef,
	) {
		super(moduleRef);
	}

	call() {
		return this.constructor.name;
	}

	getServiceBName() {
		return this.serviceB.call();
	}
}
