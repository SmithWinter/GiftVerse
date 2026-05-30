import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UserService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>>;
    findByEmail(email: string): Promise<User | undefined>;
    findById(id: number): Promise<Omit<User, 'password'> | undefined>;
}
