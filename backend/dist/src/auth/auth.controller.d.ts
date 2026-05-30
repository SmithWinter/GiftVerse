import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    signup(createUserDto: CreateUserDto): Promise<{
        access_token: string;
        user: Omit<import("../user/user.entity").User, "password">;
    }>;
    login(loginDto: LoginDto, req: any): Promise<{
        access_token: string;
        user: any;
    }>;
    getProfile(req: any): any;
}
