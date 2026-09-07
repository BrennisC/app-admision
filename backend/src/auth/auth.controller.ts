import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Public } from "./auth.decorators";
import { AuthService } from "./auth.service";
import type { AuthenticatedUser } from "./auth.types";
import { LoginDto } from "./dto/login.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @ApiOperation({ summary: "Inicia una sesion" })
  login(@Body() input: LoginDto) {
    return this.authService.login(input);
  }

  @Get("me")
  @ApiBearerAuth()
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
