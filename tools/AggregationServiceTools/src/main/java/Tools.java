import java.io.IOException;
import java.util.HashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Tools {
  public static HashMap<String, String> getRequestParams(String[] requestArgs){
    int lengthOfInput = requestArgs.length;
    HashMap<String, String> requestParams = new HashMap<>();
    int i = 0;
    while (i < lengthOfInput) {
      switch (requestArgs[i]){
        case "--request_type":
          String requestType = requestArgs[i+1];
          requestParams.put("requestType", requestType);
          i += 2;
          break;

        case "--input_file":
          String inputFile = requestArgs[i+1];
          requestParams.put("inputFile", inputFile);
          i += 2;
          break;

        case "--debug":
          requestParams.put("debugMode", "true");
          i += 1;
          break;

        case "--bucket_key":
          String bucketKey = requestArgs[i+1];
          requestParams.put("bucketKey", bucketKey);
          i += 2;
          break;

        case "--output_file":
          String outputFile = requestArgs[i+1];
          requestParams.put("outputFile", outputFile);
          i += 2;
          break;

        default:
          System.out.println("Problematic Request. Please type \"--help\" if help is needed.");
          i += lengthOfInput;
          break;
      }
    }
    return requestParams;
  }

  public static void processRequest(HashMap<String, String> requestParams) throws Exception {
    String requestType = requestParams.get("requestType");
    boolean hasInputFile = requestParams.containsKey("inputFile");
    switch (requestType){
      case "convertToAvro":
        if (!hasInputFile) {
          throw new Exception("requestType convertToAvro missing inputFile. Include \"--input_file [filename]\" in arguments.");
        }
        try {

          // AvroEncoder.encodeReport(requestParams);
          AvroEncoder.convertToAvroReport(requestParams);
        } catch (Exception e) {
          System.out.println(e);
        }
        break;

      case "convertToJson":
        if(!hasInputFile) {
          throw new Exception("requestType convertToJson missing inputFile. Include \"--input_file [filename]\" in arguments.");
        }
        try {
          AvroFileReader.avroReader(requestParams);
        } catch (Exception e) {
          System.out.println(e);
        }
        break;

      case "createDomainAvro":
        boolean hasBucketKey = requestParams.containsKey("bucketKey");
        if (!hasBucketKey) {
          throw new Exception("requestType createDomainAvro missing bucketKey. Include \"--bucket_key [bucket key]\" in arguments.");
        }
        OutputDomain.createOutputDomain(requestParams);
        break;

      default:
        System.out.println("Invalid request type");
        break;

    }
  }

  public static String getFileName(HashMap<String, String> requestParameters){
    String fileName = "output_domain";
    String fileExtension = ".avro";
    if (requestParameters.containsKey("inputFile")){
      String inputFile = requestParameters.get("inputFile");
      fileName = getFileNameFromPath(inputFile);
      fileExtension = getFileExtension(inputFile);
    }

    if (requestParameters.containsKey("outputFile")) {
      fileName = requestParameters.get("outputFile");
    } else {
      fileName = fileName + fileExtension;
    }
    return fileName;
  }

  private static String getFileExtension(String path){
    String fileExtension = ".avro";
    // define the regular expression
    Pattern pattern = Pattern.compile("(^\\/.+\\/)?(.*).(json|avro)");

    // match regular expression with the file path
    Matcher matcher = pattern.matcher(path);
    matcher.find();

    String inputFileExtension = matcher.group(3);
    if (inputFileExtension.equals("avro")){
      fileExtension = ".json";
    }
    return fileExtension;
  }

  private static String getFileNameFromPath(String path){
    // define the regular expression
    Pattern pattern = Pattern.compile("(^\\/.+\\/)?(.*).(json|avro)");

    // match regular expression with the file path
    Matcher matcher = pattern.matcher(path);
    matcher.find();

    String fileName = matcher.group(2);

    return fileName;
  }

}
