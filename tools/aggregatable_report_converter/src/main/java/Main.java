import java.io.IOException;
import java.sql.SQLOutput;
import java.util.HashMap;
import java.util.Scanner;

public class Main {

  public static void main(String[] args) throws Exception {
    int lengthOfInput = args.length;
    if (lengthOfInput == 0) {
      System.out.println("Please provide arguments. If you need help, use \"--help\".");
      return;
    }
    if ((lengthOfInput == 1) && (args[0].equals("--help"))){
      HelpOption.getHelp();
      return;
    }
    HashMap<String, String> requestParams = Tools.getRequestParams(args);
    Tools.processRequest(requestParams);
  }

}